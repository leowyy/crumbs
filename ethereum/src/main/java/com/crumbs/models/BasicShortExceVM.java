package com.crumbs.models;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

/**
 * Created by low on 23/2/17 2:49 PM.
 * common view model for shortages and excess
 */
@Getter
@Setter
public class BasicShortExceVM implements Serializable {

	private int quantity;
	private double urgency;
	private String urgencyLevel;
	private double percentExtra;
	private String name;
	private String category;
	private long price;
	private int offerQuantity;
	private boolean hidden = false;

	public void hide() {
		hidden = true;
	}

	public void show() {
		hidden = false;
	}
}
