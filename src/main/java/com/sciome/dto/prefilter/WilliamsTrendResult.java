package com.sciome.dto.prefilter;

/**
 * Result data for Williams Trend Test prefilter analysis
 * Williams test only produces p-values (stored in base class)
 * No additional fields beyond PrefilterResult
 */
public class WilliamsTrendResult extends PrefilterResult {

    public WilliamsTrendResult() {
        super();
    }
}
