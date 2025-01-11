

function maskS2clouds(image) {
    var qa = image.select('QA60');
  
    // Bits 10 and 11 are clouds and cirrus, respectively.
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
  
    // Both flags should be set to zero, indicating clear conditions.
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  
    return image.updateMask(mask).divide(10000);
  }
  
  
  // 1. Load Sentinel 2A image
  var sentinel = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10));
  // .map(maskS2clouds);
  
  
  
  // Calculate min and max for each band across the collection
  var globalMinMax = sentinel.reduce(ee.Reducer.minMax());
  print('Global min and max for each band:', globalMinMax);
  
  print("the geometry variable is : ")
  print(roi)
  
  // Define periods (adjust dates based on local growing and harvest cycles)
  var period1_start = '2024-05-01'; // start of may
  var period1_end = '2024-08-31'; // end of august
  
  var period2_start = '2024-10-01'; // start of october
  var period2_end = '2024-11-30'; // end of november
  
  
  
  
  var before = sentinel.filterDate(period1_start, period1_end);
  print("Harvest Period images : ", before.count()); 
                   
  var after = sentinel.filterDate(period2_start, period2_end);
  print("Tillage Period images : ", after.count());
  
  
  var trueColorVis = { min:0, max:2500, bands: ['B4', 'B3', 'B2'] };
  var irColorVis = { min:0, max:2500, bands: ['B5', 'B4', 'B3'] };
  
  
  var rgb_before = before.median().clip(roi);
  Map.addLayer(rgb_before , trueColorVis, 'Before Tillage (True Color)');
  Map.addLayer(rgb_before, irColorVis, 'Before Tillage (False Color)');
  
  
  var rgb_after = after.median().clip(roi)
  Map.addLayer( rgb_after, trueColorVis, 'After Tillage (True Color)');
  Map.addLayer(rgb_after, irColorVis, 'After Tillage (False Color)');
  
  
  // var palette = [
  //   'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
  //   '74A901', '66A000', '529400', '3E8601', '207401', '056201',
  //   '004C00', '023B01', '012E01', '011D01', '011301'];
  
  // Write a function that computes NDVI for an image and adds it as a band
  function addNDVI(image) {
    var ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi');
    return image.addBands(ndvi);
  }
  
  var ndviVis = {min:0, max:0.5, bands: ['ndvi'] };
  
  // Map the function during cultivation period.
  var before_ndvi = before.map(addNDVI).median().clip(roi); //  .median().select('ndvi');
  Map.addLayer(before_ndvi, ndviVis, 'NDVI Before Tillage');
  
  
  var after_ndvi = after.map(addNDVI).median().clip(roi); // .median().select('ndvi');
  Map.addLayer(after_ndvi, ndviVis, 'NDVI After Tillage');
  
  
  /// EXPORT RGB IMAGES BEFORE AND AFTER ///
  
  Export.image.toDrive({
    image: rgb_before.visualize({bands: ['B4', 'B3', 'B2'], min: 0, max: 2500}).toFloat(),
    description: 'RGB_Before_Tillage',
    fileNamePrefix: 'RGB_Before_Tillage',
    region: roi,
    scale: 10,  // Sentinel-2 resolution
  });
  
  Export.image.toDrive({
    image: rgb_after.visualize({bands: ['B4', 'B3', 'B2'], min: 0, max: 2500}).toFloat(),
    description: 'RGB_After_Tillage',
    fileNamePrefix: 'RGB_After_Tillage',
    region: roi,
    scale: 10,  // Sentinel-2 resolution
  });
  /// END OF EXPORT ///
  
  // Compute the difference between NDVI layers (After Tillage - Before Tillage)
  var ndvi_difference = before_ndvi.subtract(after_ndvi);
  
  // Define visualization parameters for NDVI difference
  var ndviDiffVis = {min: -0.5, max: 0.5, bands: ['ndvi']};
  print(ndvi_difference, ndviDiffVis);
  // Add the NDVI difference layer to the map
  Map.addLayer(ndvi_difference, ndviDiffVis, 'NDVI Difference (Before - After)');
  
  
  // // Calculate the min and max NDVI values for the "before" and "after" periods
  // var before_ndvi_range = before_ndvi.reduce(ee.Reducer.minMax()).select(['ndvi_min', 'ndvi_max']);
  // var after_ndvi_range = after_ndvi.reduce(ee.Reducer.minMax()).select(['ndvi_min', 'ndvi_max']);
  
  // // Print the NDVI range for "before" and "after" layers
  // print("NDVI range for Before Tillage:", before_ndvi_range);
  // print("NDVI range for After Tillage:", after_ndvi_range);
  // Export the 'before' NDVI composite to Google Drive
  
  
  Export.image.toDrive({
    image: before_ndvi,
    description: 'NDVI_Before_Tillage',
    fileNamePrefix: 'NDVI_Before_Tillage',
    region: roi,
    scale: 10,  // Sentinel-2 resolution
  });
  
  // Export the 'after' NDVI composite to Google Drive
  Export.image.toDrive({
    image: after_ndvi,
    description: 'NDVI_After_Tillage',
    fileNamePrefix: 'NDVI_After_Tillage',
    region: roi,
    scale: 10,  // Sentinel-2 resolution
  });
  
  
  
  