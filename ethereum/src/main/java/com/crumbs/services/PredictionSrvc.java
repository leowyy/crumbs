package com.crumbs.services;

import com.alibaba.fastjson.JSON;
import com.crumbs.entities.Product;
import com.crumbs.entities.SalesRecord;
import com.crumbs.models.*;
import com.crumbs.repositories.ProductRepo;
import com.crumbs.repositories.SalesRecordRepo;
import com.crumbs.util.DateUtil;
import com.crumbs.util.UrgencyUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Created by low on 18/2/17 4:31 PM.
 */
@Service
public class PredictionSrvc {

	private static final Logger logger = LoggerFactory.getLogger(PredictionSrvc.class);

	@Autowired
	RestTemplate restTemplate;

	@Autowired
	InventoryService inventoryService;

	@Autowired
	SalesRecordRepo salesRecordRepo;

	@Autowired
	ProductRepo productRepo;

	@Autowired
	PredictionCacheSrvc predictionCache;

	@Autowired
	InventoryCacheSrvc inventoryCache;

	private int roundUpToNearestK( int query, int k ){
		int x = (int)Math.ceil(query/k)*k;
		return x;
	}

	public PredictionQty getPredictionQty() {
		PredictionQty qty = new PredictionQty();
		if (predictionCache.needsFirstRun()) {
			qty.setValid(false);
		}
		else {
			qty.setValid(true);
			qty.setExcess(predictionCache.countExcess());
			qty.setShortage(predictionCache.countShortage());
		}

		return qty;
	}

	public PredictionVM getAndRankPredictions() {
		if (predictionCache.needsFirstRun()) {
			List<Prediction> predictions = getAllPredictions();
			predictionCache.setPredictionCache(pullAndRankRelavantPredictions(predictions));
		}
		else {
			List<String> products = predictionCache.getNeedsCalc();
			if (!products.isEmpty()) {
				predictionCache.addPredictions(getPredictions(products));
			}
		}
		return predictionCache.getPredictionCache();
	}

	public PredictionVM pullAndRankRelavantPredictions(List<Prediction> predictions) {
		PredictionVM predictionVM = new PredictionVM();
		predictions.forEach(p -> {
			p.getShipments().forEach(s -> {
				if (!s.getUrgencyLevel().equalsIgnoreCase("green") && !s.getExpiry().before(DateUtil.daysFromToday(2)))
					predictionVM.addExcess(new ExceShipVM(p.getProduct(), s));
			});
			p.getStocks().forEach(s -> {
				if (!s.getUrgencyLevel().equalsIgnoreCase("green"))
					predictionVM.addShortage(new RemStockVM(p.getProduct(), s));
			});
		});
		predictionVM.getExcessShipments().sort((s, s1) -> -Double.compare(s.getUrgency(), s1.getUrgency()));
		predictionVM.getStockShortages().sort((s, s1) -> Double.compare(s.getUrgency(), s1.getUrgency()));
		return predictionVM;
	}

	public List<Prediction> getAllPredictions() {
		return getPredictions(productRepo.findAll());
	}

	public List<Prediction> getPredictions(List<String> products) {
		return getPredictions(productRepo.findAll(products));
	}

	public List<Prediction> getPredictions(Iterable<Product> products) {

		List<Prediction> predictions = new ArrayList<>();
		products.forEach(p -> {
			Map<String, List<Integer>> map = new HashMap<>();
			map.put("sales", buildArrayQuery(p.getName()));
			logger.info("predicting for {}", p.getName());

			// response contains the 7 days of sales predictions
			ResponseEntity<PredictionReceipt> response = restTemplate.postForEntity("http://localhost:5000/predict", map, PredictionReceipt.class);
			logger.info(JSON.toJSONString(response.getBody()));

			// create prediction from sales
			predictions.add(buildPrediction(response.getBody().getPredictions(), p.getName()));
		});
		return predictions;
	}

	public List<Integer> buildArrayQuery(String product) {
		Product p = new Product();
		p.setName(product);
		List<SalesRecord> salesRecords = salesRecordRepo.findByProductAndDateStampBeforeOrderByDateStampAsc(p, DateUtil.today());
		List<Integer> query = new ArrayList<>();
		salesRecords.forEach((record) -> query.add(record.getQuantity()));
		return query;
	}

	public Prediction buildPrediction(List<Integer> predictedDemand, String product) {
		if (predictedDemand.size() != 15) {
			logger.error("demand array not of size 15");
			return null;
		}
		ProductVM productVM = inventoryService.getProduct(product);
		List<StockUpdate> currentStock = inventoryService.stockUpdateList(product, -6, 14);

		//Collects past 7 days of demand together with predicted demand
		Product p = new Product();
		p.setName(product);
		List<SalesRecord> pastRecords = salesRecordRepo.findByProductAndDateStampBeforeAndDateStampAfterOrderByDateStampAsc(p, DateUtil.today(), DateUtil.daysFromToday(-8));
		List<Integer> demand = new ArrayList<>();
		pastRecords.forEach(r -> demand.add(r.getQuantity()));
		demand.addAll(predictedDemand);

		Prediction prediction = new Prediction();
		prediction.setProduct(productVM);

		List<Integer> startingInventory = new ArrayList<>();
		List<Integer> stockUp = new ArrayList<>();
		stockUp.add(-1); //pad with -1 for front-end visualization
		List<Integer> endingInventory = new ArrayList<>();
		List<Integer> disposals = new ArrayList<>();
		currentStock.forEach(stock -> disposals.add(stock.getDisposed()));

		//NB: currentStocks and disposal start from day -6 (index 0) containing 21 values while demand starts from day -7 containing 22 values

		//get starting inventory quantity for day 0
		int carryOver = currentStock.get(0).getCurrentQuantity() - currentStock.get(0).getStock() + currentStock.get(0).getDisposed();

		for (int i = 0; i < currentStock.size(); i++) {
			startingInventory.add(carryOver);
			stockUp.add(currentStock.get(i).getStock());

			//Reduce subsequent disposal by the number of goods sold
			int toDeduct = demand.get(i);
			for (int j = i; j < currentStock.size(); j++) {
				int initialDispose = disposals.get(j);
				disposals.set((j), Integer.max(0, initialDispose - toDeduct));
				toDeduct = toDeduct - initialDispose;
				if (toDeduct < 0) break;
			}

			//Adds to prediction for the predicted values
				//ending inventory
				int predictedStock = carryOver - demand.get(i);
				endingInventory.add(predictedStock);

			if (i > 6) {
				//ideal value to be put up to offer for shortages
				int toOffer = (int) (demand.get(i) * (UrgencyUtil.getPerfectExcess())) - predictedStock;
				toOffer = roundUpToNearestK(toOffer,20);
				prediction.addToStockList(new RemainingStock(demand.get(i), predictedStock, i-7, toOffer));

				//ideal value to be put up to offer for excess
				toOffer = disposals.get(i) - (int) (currentStock.get(i).getDisposed() * UrgencyUtil.getPerfectDisposal());
				toOffer = roundUpToNearestK(toOffer,20);
				prediction.addToShipmentList(new ExcessShipment(currentStock.get(i).getDisposed(), disposals.get(i), i-7, toOffer));
			}

			//new starting inventory
			carryOver = Integer.max(0, carryOver - demand.get(i) - disposals.get(i)) + currentStock.get(i).getStock();
		}
		//Finish up for the last day
		startingInventory.add(carryOver);
		int predictedStock = carryOver - demand.get(21);
		endingInventory.add(predictedStock);
		int toOffer = (int) (demand.get(21) * (UrgencyUtil.getPerfectExcess())) - predictedStock;
		prediction.addToStockList(new RemainingStock(demand.get(21), predictedStock, 14, toOffer));

		//pad with -1 for front-end chart visualization
		disposals.add(0, -1);
		inventoryCache.setCache(product, startingInventory, stockUp, demand, endingInventory, disposals);

		return prediction;
	}

	/**
	 * @deprecated
	 */
	public List<Integer> aggregatedStock(List<Integer> demand, String product) {
		List<Integer> predictedStock = new ArrayList<>();
		List<StockUpdate> currentStock = inventoryService.futureStockInArray(product);

		//NB: current stocks start from day 1 (index 0) containing 7 values while demand starts from day 0 containing 15 values
		int carryOver = currentStock.get(0).getCurrentQuantity() - currentStock.get(0).getStock() + currentStock.get(0).getDisposed();
		for (int i = 0; i < 7; i++) {
			predictedStock.add(carryOver - demand.get(i));
			int toDeduct = demand.get(i);
			int j = i;
			while (toDeduct > 0 || j < 7) {
				StockUpdate stock = currentStock.get(j);
				int initialDispose = stock.getDisposed();
				stock.setDisposed(Integer.max(0, initialDispose - toDeduct));
				toDeduct = toDeduct - initialDispose;
				j++;
			}
			//carryOver = Integer.max(0, carryOver - Integer.max(demand.get(i), currentStock.get(i).getDisposed())) + currentStock.get(i).getStock();
			carryOver = Integer.max(0, carryOver - demand.get(i) - currentStock.get(i).getDisposed()) + currentStock.get(i).getStock();
		}
		predictedStock.add(carryOver - demand.get(7));

		return predictedStock;
	}

}
