var map,
  layer,
  bz, imgbz,
  imageLayer,
  vectorLayer,
  vectorBZ,
  markerYjjg, clusterLayer,
  dataUrl, ids, popup,
  deleteFeatureId,
  beforeStyle, //上一个图层类型；用于定位
  beforeFeature, // 上一个图层要素；用于定位
  drawpoint,
  currentFeature,
  selectStyle = {
    strokeColor: "#011672",
    strokeWidth: 8,
    pointerEvents: "visiblePainted",
    fillColor: "#011672",
    fillOpacity: 0.4,
    pointRadius: 2
  },
  normalStyle = {
    strokeColor: "#4169E1",
    strokeWidth: 8,
    strokeOpacity: 0.8
  },
  bufferStyle = {
    strokeColor: "red",
    strokeWidth: 4,
    strokeOpacity: 0.8
  },
  bufferSafeStyle = {
    strokeColor: "green",
    strokeWidth: 4,
    strokeOpacity: 0.8
  },
  modifyFeature, drawLine,
  selectFeature,
  featureId;
var resolutions = [0.7031249999891485, 0.35156249999999994, 0.17578124999999997, 0.08789062500000014, 0.04394531250000007, 0.021972656250000007, 0.01098632812500002,
  0.00549316406250001, 0.0027465820312500017, 0.0013732910156250009, 0.000686645507812499, 0.0003433227539062495,
  0.00017166137695312503, 0.00008583068847656251, 0.000042915344238281406, 0.000021457672119140645, 0.000010728836059570307,
  0.000005364418029785169
];
//地图初始化
function initMap(x, y, level) {
  console.log(111);
  vectorLayer = new OpenLayers.Layer.Vector("线路图层");
  vectorLayer.style = selectStyle;
  vectorBZ = new OpenLayers.Layer.Vector("线路标注");

  modifyFeature = initModifyFeature(vectorLayer);
  drawLine = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Path);
  drawpoint = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point);
  drawLine.events.on({
    "featureadded": drawLineCompleted
  });
  drawpoint.events.on({
    "featureadded": drawPointCompleted
  });
  map = new OpenLayers.Map("map", {
    controls: [
      new OpenLayers.Control.ScaleLine(),
      new OpenLayers.Control.Navigation({
        dragPanOptions: {
          enableKinetic: true
        }
      }), drawLine, drawpoint
    ],
    allOverlays: true,
    resolutions: resolutions

  });

  map.addControls([modifyFeature]);



  selectFeature = initSelectFeature(vectorLayer);
  selectFeature.selectStyle = selectStyle;
  map.addControls([selectFeature]);
  selectFeature.activate();
  //新建图层
  layer = new OpenLayers.Layer.WMTS({
    name: "底图",
    url: "http://t0.tianditu.com/vec_c/wmts",
    layer: "vec",
    style: "default",
    matrixSet: "c",
    format: "tiles",
    matrixIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
    requestEncoding: "KVP"
  });

  bz = new OpenLayers.Layer.WMTS({
    name: "标注",
    url: "http://t0.tianditu.com/cva_c/wmts",
    layer: "cva",
    style: "default",
    matrixSet: "c",
    format: "tiles",
    opacity: 1,
    matrixIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
    requestEncoding: "KVP"
  });

  imgLayer = new OpenLayers.Layer.WMTS({
    name: "影像",
    url: "http://t0.tianditu.com/img_c/wmts",
    layer: "img",
    style: "default",
    matrixSet: "c",
    format: "tiles",
    matrixIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
    requestEncoding: "KVP"
  });

  imgbz = new OpenLayers.Layer.WMTS({
    name: "标注",
    url: "http://t0.tianditu.com/cia_c/wmts",
    layer: "cia",
    style: "default",
    matrixSet: "c",
    format: "tiles",
    opacity: 1,
    matrixIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
    requestEncoding: "KVP"
  });

  vectorBZ.setVisibility(false);
  imgLayer.setVisibility(false);
  imgbz.setVisibility(false);
  //图层添加并显示指定级别
  map.addLayers([layer, imgLayer, bz, imgbz, vectorLayer, vectorBZ]);
  map.setCenter(new OpenLayers.LonLat(parseFloat(x), parseFloat(y)), 5);
  // select.activate();
  //加载网格
  // getData();
  map.events.on({
    "click": clear
  });
}
//
//    function showVillageBZ() {
//        if (map.getZoom() >= 4) {
//            vectorVillageBZ.setVisibility(true);
//        } else {
//            vectorVillageBZ.setVisibility(false);
//        }
//    }

function clear() {
  if (beforeFeature) {
    beforeFeature.style = normalStyle;
    beforeFeature = null;
    vectorLayer.redraw();
  }
}
//初始化选择要素控件
function initSelectFeature(layer) {
  var styleFeature = {
    strokeColor: "#0099FF",
    strokeWidth: 2,
    pointerEvents: "visiblePainted",
    fillColor: "#0066CC",
    fillOpacity: 0.4,
    pointRadius: 6,
    label: "",
    fontSize: 14,
    fontWeight: "normal",
    cursor: "pointer"
  };
  var selectFeature = new OpenLayers.Control.SelectFeature(layer, {
    onSelect: openWindow,
    onUnselect: clearSelectId
  });
  selectFeature.selectStyle = styleFeature;
  return selectFeature;
}
//初始化修改要素控件
function initModifyFeature(layer) {
  //        var modifyFeature = new OpenLayers.Control.ModifyFeature(layer, { selectFeature: selectModifyFeature });
  var modifyFeature = new OpenLayers.Control.ModifyFeature(layer);
  return modifyFeature;
}

//激活添加地物
function activateAddFeature() {
  //先清除上次的显示结果
  //vectorLayer.removeAllFeatures();
  clearAllDeactivate();
  //var type = $("#gridType").val();
  drawLine.activate();
}
//    //执行添加地物
//    function addFeatureCompleted(drawGeometryArgs) {
//        if (drawLine != null) {
//            currentDrawPolygon.deactivate();
//        }
//        var geometry = drawGeometryArgs.feature.geometry;
//        currentSelectFeature = drawGeometryArgs.feature;
//        currentSelectFeature.geometry = geometry;
//    }

function stopModify() {
  if (modifyFeature != null) {
    var feature = modifyFeature.feature;
    if (feature) {
      featureId = feature.code;
    }
    modifyFeature.deactivate();
  }
  selectFeature.activate();
  //map.setLayerIndex(vectorLayer, 2);
}


//清除选中id
function clearSelectId(feature) {
  featureId = null;
}
//信息窗
function openWindow(feature) {
  //getpointsStr(vertices);
  featureId = feature.code;
  currentFeature = feature;
  if (feature.radius) {
    $("#radiusvalue").val(feature.radius);
  }
}

function buttonSaveGrid() {
  stopModify();
  saveLine();
  selectFeature.activate();
}

function buttonSaveBuffer() {
  stopModify();
  saveBuffer();
  selectFeature.activate();
}
//激活编辑地物
function editselectedFeature() {
  clearAllDeactivate();
  stopModify();
  modifyFeature.activate();
}

function clearAllDeactivate() {
  clearSelectId();
  selectFeature.deactivate();
  modifyFeature.deactivate();
  drawLine.deactivate();
}

//feature转换
function getpointsStr(feature) {
  var pointsStr = "";
  var vertices = feature.geometry.getVertices();
  if (vertices != null && vertices.length > 0) {
    for (var i = 0; i < vertices.length; i++) {
      var point = vertices[i];
      var lng = Math.round(point.x * 1000000) / 1000000;
      var lat = Math.round(point.y * 1000000) / 1000000;
      if (i == 0) {
        pointsStr += lng + "," + lat;
      } else {
        pointsStr += ":" + lng + "," + lat;
      }
    }
  }
  return pointsStr;
}

//获取覆盖物
function getData() {
  $.ajax({
    type: "get",
    url: ctx + "/main/road!datagrid.action",
    dataType: 'json',
    success: function (data) {
      if (data != null) {
        drawLineFun(data.rows);
      }
    }
  });
  //        $.get(encodeURI("GridManage/saveGrid.ashx?Action=getData&grid=" + grid + "&dd=" + new Date().getTime().toString()), {}, function (data) {
  //            if (data != null) {
  //                drawGrid(data);
  //            }
  //        }, "json");

}

//保存
function saveGrid() {
  var pointsStr = "";
  var placeNameId = $("#placeId").val();
  var grid = $("#grid").val();
  var type = $("#gridType").val();
  var layer = getLayer(type);
  var bounds = $("#bounds").val();
  var features = layer.features;
  var newBounds = "";
  if (placeNameId != "") {
    for (var i = 0; i < features.length; i++) {
      if (features[i].placenameid == placeNameId) {
        if (pointsStr == "") {
          pointsStr += getpointsStr(features[i]);
        } else {
          pointsStr += ";" + getpointsStr(features[i]);
        }
        newBounds = features[i].geometry.getBounds();
        newBounds = newBounds.left + "," + newBounds.bottom + "," + newBounds.right + "," + newBounds.top;
      }
    }
    if (bounds != newBounds) {
      $.ajax({
        type: "get",
        url: ctx + "/main/tegrid!saveGrid.action",
        dataType: 'json',
        data: {
          placeId: encodeURI(placeNameId),
          bounds: newBounds,
          pointsStr: pointsStr
        },
        success: function (data) {
          if (data == true) {
            top.$.messager.alert("提示信息", "保存成功", "info"); //操作结果提示
          } else {
            top.$.messager.alert("提示信息", "保存失败", "error"); //操作结果提示
          }
        }
      });
    } else {
      top.$.messager.alert("提示信息", "网格信息未修改", "info"); //操作结果提示
    }

  } else {
    top.$.messager.alert("提示信息", "请先选择图层", "error");
  }
}

function setFeature(entity) {
  var feature = {
    pointsStr: entity.xyGps,
    placenameId: entity.grid,
    grid: entity.grid,
    name: entity.gridName,
    gridtype: entity.gridType,
    lng: entity.resLongitudeGps,
    lat: entity.resLatitudeGps
  };
  return feature;
}

//绘制网格
function drawGrid(data) {
  var points = null;
  var point = null;
  if (data != null && data.length > 0) {
    for (var i = 0; i < data.length; i++) {
      var entity = data[i];
      var feature = setFeature(entity);
      if (feature.pointsStr != undefined) {
        var polygonArray = feature.pointsStr.split(";");
        if (polygonArray.length > 0) {
          for (var j = 0; j < polygonArray.length; j++) {
            points = new Array();
            var polygonStr = polygonArray[j];
            var pointsArray = polygonStr.split(":");
            for (var k = 0; k < pointsArray.length; k++) {
              var pointStr = pointsArray[k];
              var pointArray = pointStr.split(",");
              point = new OpenLayers.Geometry.Point(parseFloat(pointArray[0]), parseFloat(pointArray[1]))
              points.push(point);
            }
            var linearRings = new OpenLayers.Geometry.LinearRing(points);
            var region = new OpenLayers.Geometry.Polygon([linearRings]);
            var style = getStyle(feature.gridtype);
            if (linearRings.getCentroid() != null) {
              drawLabel(linearRings.getCentroid().x, linearRings.getCentroid().y, feature.name, feature.gridtype);
            } else {
              drawLabel(feature.lng, feature.lat, feature.name, feature.gridtype);
            }
            var featurePolygon = new OpenLayers.Feature.Vector(region, null, style);
            featurePolygon.placenameid = feature.placenameId;
            featurePolygon.name = feature.grid;
            featurePolygon.gridtype = feature.gridtype;
            var layer = getLayer(feature.gridtype);
            layer.addFeatures(featurePolygon);
            var grid = $("#userGrid").val();
            if (feature.grid == grid) {
              var bounds = featurePolygon.geometry.getBounds();
              map.zoomToExtent(bounds, false);
            }
          }
        }
      }

    }
  }
  maskTool.hideMask();
}

function getLayer(type) {
  var layer = new OpenLayers.Layer.Vector();
  if (type == "村级") {
    layer = vectorVillageLayer;
  } else if (type == "镇级") {
    layer = vectorTownLayer;
  } else {
    layer = vectorCountyLayer;
  }
  return layer;
}

function getStyle(type) {
  var style = "";
  if (type == "村级") {

    style = {
      strokeColor: "#712a2b",
      strokeWidth: 1,
      pointerEvents: "visiblePainted",
      fillColor: "#fe020e",
      fillOpacity: 0.2,
      pointRadius: 2
    };
  } else if (type == "镇级") {

    style = {
      strokeColor: "#ffffff",
      strokeWidth: 1,
      pointerEvents: "visiblePainted",
      fillColor: "#f9fc00",
      fillOpacity: 0.3,
      pointRadius: 2
    };
  } else {
    style = {
      strokeColor: "#011672",
      strokeWidth: 1,
      pointerEvents: "visiblePainted",
      fillColor: "#011672",
      fillOpacity: 0.4,
      pointRadius: 2
    };
  }
  return style;
}

//绘制标注
function drawLabel(lng, lat, name, type) {
  var geometry = new OpenLayers.Geometry.Point(lng, lat);
  var pointFeature = new OpenLayers.Feature.Vector(geometry);
  var style = "";
  if (type == "村级") {
    style = {
      label: name,
      fontColor: "#000000",
      fontOpacity: "1",
      fontSize: "14px",
      fontFamily: "宋体",
      fontWeight: "bold"
    };
    pointFeature.style = style;
    vectorVillageBZ.addFeatures([pointFeature]);
  } else if (type == "镇级") {
    style = {
      label: name,
      fontColor: "#000000",
      fontOpacity: "1",
      fontFamily: "宋体",
      fontSize: "12px",
      fontWeight: "bold"
    };
    pointFeature.style = style;
    vectorTownBZ.addFeatures([pointFeature]);
  } else {
    style = {
      label: name,
      fontColor: "#ffffff",
      fontOpacity: "1",
      fontFamily: "宋体",
      fontWeight: "bold",
      fontSize: "30px"
    };
    pointFeature.style = style;
    vectorBZ.addFeatures([pointFeature]);
  }
}

//切换影像地图
function changeImageMap() {
  //        if (map.getLayerIndex(layer) == 0) {
  //            map.removeLayer(layer);
  //            map.addLayer(imgLayer);
  //            map.setLayerIndex(imgLayer, 0);
  //        }
  layer.setVisibility(false);
  imgLayer.setVisibility(true);
  imgbz.setVisibility(true);
  bz.setVisibility(false);
}
//切换普通地图
function changeMap() {
  //        if (map.getLayerIndex(imgLayer) == 0) {
  //            map.removeLayer(imgLayer);
  //            map.addLayer(layer);
  //            map.setLayerIndex(layer, 0);
  //        }
  layer.setVisibility(true);
  imgLayer.setVisibility(false);
  imgbz.setVisibility(false);
  bz.setVisibility(true);
}


function selectModifyFeature(feature) {
  modifyFeature.standalone == false;
}

//是否可编辑
function isEditable(grid) {
  var result = true;
  if (grid != $("#placeId").val()) {
    result = false;
  }
  return result;
}

function getFeatureById(id, type) {
  if (id != null) {
    var features = vectorLayer.features;
    if (features != null && features.length > 0) {
      for (var i = 0; i < features.length; i++) {
        if (features[i].code == id) {
          if (type) {
            if (features[i].flag == type) {
              return features[i];
              break;
            }
          } else {
            return features[i];
            break;
          }
        }
      }
    }
  }
}

//删除
function deleteSelectFeature(type) {
  var url = ctx + "/frljk/road!remove.action";
  if (type) {
    url = ctx + "/frljk/taskroad!remove.action";
  }

  if (featureId != null) {
    var id = featureId;
    top.$.messager.confirm("确认提示！", "您确定要删除选中路段?", function (ok) {
      if (ok) {
        var ids = new Object();
        ids[0] = id;
        $.post(url, {
            ids: ids
          },
          function (data) {
            if (data.code == 1) {
              var feature = getFeatureById(id);
              vectorLayer.removeFeatures(feature);
              f_search();
            }
          }, "json");
      }
      clearSelectId();
    });
  } else {
    top.$.messager.alert("提示信息", "请先选中网格", "error"); //操作结果提示
  }
  vectorLayer.redraw();

}

//放大
function zoomIn() {
  map.zoomIn();
}

//缩小
function zoomOut() {
  map.zoomOut();
}

//定位
function panTo(x, y, level) {
  map.setCenter(new OpenLayers.LonLat(parseFloat(x), parseFloat(y)), parseFloat(level));
}

//获取小图标覆盖物
function addLittleLayer(sql) {
  $.ajax({
    type: "get",
    url: ctx + "/main/getdata!getGridMarkersData.action",
    dataType: 'json',
    data: {
      sqlStr: encodeURI(sql)
    },
    success: function (data) {
      drawLittleMarkers(data);
    }
  });
}
//渲染markers小图标
function drawLittleMarkers(data) {
  var ps = [];
  for (var i = 0; i < data.length; i++) {
    var entity = data[i];
    //            var setmarker = setLittleMarker(entity);
    //            var marker = new OpenLayers.Marker(new OpenLayers.LonLat(setmarker.lng, setmarker.lat), setmarker.icon);
    //            marker.unid = setmarker.unid;
    //            marker.name = setmarker.name;
    //            marker.table = setmarker.table;
    //            marker.events.on({
    //                "mouseover": showLabel,
    //                "mouseout": function () {
    //                    if (popup != null) {
    //                        map.removePopup(popup);
    //                    }
    //                }
    //            });
    //            markerYjjg.addMarker(marker);

    var f = new OpenLayers.Feature.Vector();
    f.geometry = new OpenLayers.Geometry.Point(entity.resLon, entity.resLat);
    f.style = {
      pointRadius: 4,
      graphic: true,
      externalGraphic: "GridManage/theme/images/cluster4.png",
      graphicWidth: 12,
      graphicHeight: 12
    };
    f.info = {
      "name": entity.resName,
      "unid": entity.resGuid,
      "table": entity.resTable
    };
    ps.push(f);

  }
  clusterLayer.addFeatures(ps);
}
//显示信息提示
function showLabel(marker) {
  if (popup != null) {
    map.removePopup(popup);
  }
  var marker = this;
  var lonlat = marker.getLonLat();
  var length = marker.name.length * 12 + 2
  var contentHTML = "<div style='width:" + length + "px;font-size:12px;opacity: 0.7'>";
  contentHTML += "<div>" + marker.name + "</div></div>";

  popup = new OpenLayers.Popup.Anchored("label", new OpenLayers.LonLat(lonlat.lon, lonlat.lat), new OpenLayers.Size(length, 15), contentHTML, null, false, new OpenLayers.Size(-8, 15));
  popup.keepInMap = false;
  map.addPopup(popup);
}

//显示信息提示
function showInfo(feature) {
  if (popup != null) {
    map.removePopup(popup);
  }
  var info = feature.info;
  var lonlat = feature.geometry.getBounds().getCenterLonLat();
  var length = info.name.length * 12 + 2
  var contentHTML = "<div style='width:" + length + "px;font-size:12px;opacity: 0.7'>";
  contentHTML += "<div>" + info.name + "</div></div>";

  popup = new OpenLayers.Popup.Anchored("label", new OpenLayers.LonLat(lonlat.lon, lonlat.lat), new OpenLayers.Size(length, 15), contentHTML, null, false, new OpenLayers.Size(-8, 15));
  popup.keepInMap = false;
  map.addPopup(popup);
}

//格式化marker
function setLittleMarker(entity) {
  var marker = {
    lng: entity.resLon,
    lat: entity.resLat,
    name: entity.resName,
    unid: entity.resGuid,
    icon: new OpenLayers.Icon(ctx + "/main/images/mapicon/" + entity.icon + ".png", new OpenLayers.Size(15, 15), null),
    tag: entity,
    table: entity.resTable
  };
  return marker;
}
//更改样式
function changeStyle(id, type) {
  var features = vectorLayer.features;
  for (var i = 0; i < features.length; i++) {
    if (features[i].code == id) {
      if (type) {
        if (type == features[i].flag) {
          features[i].style = selectStyle;
        }
      } else {
        features[i].style = selectStyle;
      }
    } else {

      if (features[i].flag == "buffer") {
        if (features[i].isInside == 1) {
          features[i].style = bufferSafeStyle;
        } else {
          features[i].style = bufferStyle;
        }
      } else {
        features[i].style = normalStyle;
      }

    }
  }
  vectorLayer.redraw();
}

function topTheLayer(type) {
  var layer = getLayer(type);
  map.setLayerIndex(layer, 10);
}

function recoverLayer() {
  map.setLayerIndex(vectorLayer, 2);
}

function saveLine() {
  if (featureId != null) {
    var features = vectorLayer.features;
    if (features != null && features.length > 0) {
      for (var i = 0; i < features.length; i++) {
        if (features[i].code == featureId && features[i].flag == "xy") {
          var bound = features[i].geometry.getBounds();
          openRoadSave(getpointsStr(features[i]), bound, featureId);
          break;
        }
      }
    }
  }
}

function saveBuffer() {
  if (featureId != null) {
    var features = vectorLayer.features;
    if (features != null && features.length > 0) {
      for (var i = 0; i < features.length; i++) {
        if (features[i].code == featureId && features[i].flag == "buffer") {
          var bound = features[i].geometry.getBounds();
          openRoadSave(null, null, featureId, getpointsStr(features[i]));
          vectorLayer.removeFeatures(features[i]);
          $("#savebuffer").hide();
          $("#clearbuffer").hide();
          $("#deletebuffer").hide();
          break;
        }
      }
    }
  }
}

function deleteBuffer() {
  if (featureId != null) {
    var features = vectorLayer.features;
    if (features != null && features.length > 0) {
      for (var i = 0; i < features.length; i++) {
        if (features[i].code == featureId && features[i].flag == "buffer") {
          var feature = features[i];
          $.messager.confirm("确认提示！", "清除缓冲区后将无法恢复，您确定清除么?", function (r) {
            if (r) {
              openRoadSave(null, null, featureId, "delete");
              vectorLayer.removeFeatures(feature);
              $("#savebuffer").hide();
              $("#clearbuffer").hide();
              $("#deletebuffer").hide();
            }
          });

        }
      }
    }
  } else {
    $.messager.alert("信息提示", "请选择要删除电子围栏的路段！", "info");
  }
}

function clearBuffer() {
  var features = vectorLayer.features;
  if (features != null && features.length > 0) {
    for (var i = 0; i < features.length; i++) {
      if (features[i].flag == "buffer") {
        var bound = features[i].geometry.getBounds();
        vectorLayer.removeFeatures(features[i]);
      }
    }
    $("#savebuffer").hide();
    $("#clearbuffer").hide();
    $("#deletebuffer").hide();
  }
}

//渲染自由点
function drawLineCompleted(drawGeometryArgs) {
  //BegoodMap.vectorLayer.removeAllFeatures();
  drawLine.deactivate();
  if (drawGeometryArgs != null && drawGeometryArgs.feature != null) {
    var feature = drawGeometryArgs.feature;
    var lineStr = getpointsStr(feature);
    if (lineStr != "") {
      //弹出对话窗口
      var bound = feature.geometry.getBounds();
      openRoadSave(lineStr, bound);
      vectorLayer.removeFeatures(feature);
    }
  }
  selectFeature.activate();
  //        $("#resLongitudeGps").val(Math.round(feature.geometry.x*1000000)/1000000);
  //        $("#resLatitudeGps").val(Math.round(feature.geometry.y*1000000)/1000000);
}

//渲染自由点
function drawPointCompleted(drawGeometryArgs) {
  //BegoodMap.vectorLayer.removeAllFeatures();
  drawpoint.deactivate();
  if (drawGeometryArgs != null && drawGeometryArgs.feature != null) {
    var geometry = drawGeometryArgs.feature.geometry;
    $.getJSON(ctx + "/frljk/taskroad!test.action", {
      lon: geometry.x,
      lat: geometry.y,
      taskcode: 'FRL-20170622001-01'
    }, function (data) {
      var points = [];
      if (data != null) {
        alert(data.obj);
        //    	    		var pointsArray = data.obj.split(";");
        //    	    		if(pointsArray != null&&pointsArray.length>0){
        //    	    			for(var j=0;j<pointsArray.length;j++){
        //    	    				var pointStr = pointsArray[j];
        //    	    				var pointarray = pointStr.split(",");
        //    	    				var point = new OpenLayers.Geometry.Point(pointarray[0],pointarray[1]);
        //    	    				points.push(point);
        //    	    			}
        //    	    		}
      }
      //    	    	if(points.length >0){
      //    	        	var line =new OpenLayers.Geometry.LineString(points);
      //    	        	var lineFeature = new OpenLayers.Feature.Vector(line);
      //    	        	lineFeature.style = normalStyle;
      //    	        	vectorLayer.addFeatures(lineFeature);
      //    	    	}
    });
  }
  //        $("#resLongitudeGps").val(Math.round(feature.geometry.x*1000000)/1000000);
  //        $("#resLatitudeGps").val(Math.round(feature.geometry.y*1000000)/1000000);
}



function drawRoadStart() {
  drawLine.activate();
}

function drawLineFun(data) {
  vectorLayer.removeAllFeatures();
  if (data != null) {
    for (var i = 0; i < data.length; i++) {
      var entity = data[i];
      drawLineBySingle(entity)
    }
  }
}

function drawLineBySingle(entity) {
  var points = [];
  if (entity != null && entity.xyGps != null) {
    var pointsArray = entity.xyGps.split(":");
    if (pointsArray != null && pointsArray.length > 0) {
      for (var j = 0; j < pointsArray.length; j++) {
        var pointStr = pointsArray[j];
        var pointarray = pointStr.split(",");
        var point = new OpenLayers.Geometry.Point(pointarray[0], pointarray[1]);
        points.push(point);
      }
    }
  }
  if (points.length > 0) {
    var line = new OpenLayers.Geometry.LineString(points);
    var lineFeature = new OpenLayers.Feature.Vector(line);
    lineFeature.style = normalStyle;
    lineFeature.name = entity.startplace + "———" + entity.endplace;
    lineFeature.code = entity.id;
    lineFeature.flag = "xy";
    lineFeature.radius = entity.bufferRadius;
    var feature = getFeatureById(entity.id);
    vectorLayer.removeFeatures(feature);
    vectorLayer.addFeatures(lineFeature);
  }
}

function panToFeature(id) {
  var feature = getFeatureById(id, "xy");
  featureId = id;
  if (feature != null && feature != undefined) {
    changeStyle(id, "xy");
    var extent = feature.geometry.getBounds();
    beforeFeature = feature;
    currentFeature = feature;
    map.zoomToExtent(extent);
  }
}


function loadBuffer(data, id) {
  var points = [];
  if (data != null && data.obj != "") {
    var pointsArray = data.obj.split(":");
    if (pointsArray != null && pointsArray.length > 0) {
      for (var j = 0; j < pointsArray.length; j++) {
        var pointStr = pointsArray[j];
        var pointarray = pointStr.split(",");
        var point = new OpenLayers.Geometry.Point(pointarray[0], pointarray[1]);
        points.push(point);
      }
    }
  }
  var style = bufferStyle;
  var errorPoints = "";
  if (data.code == 1) {
    style = bufferSafeStyle;
  } else {
    errorPoints = data.attributes.points;
  }
  if (points.length > 0) {
    var line = new OpenLayers.Geometry.LineString(points);
    var lineFeature = new OpenLayers.Feature.Vector(line);
    lineFeature.style = style;
    lineFeature.code = id;
    lineFeature.flag = "buffer";
    lineFeature.isInside = data.code;
    vectorLayer.addFeatures(lineFeature);
    $("#savebuffer").show();
    $("#clearbuffer").show();
    $("#deletebuffer").show();
    if (data.code == 0) {
      $.messager.alert("提示信息", "当前缓冲区校验失败，请手动修改", "info");
    } else {
      $.messager.show("提示信息", "当前缓冲区校验通过", "info");
    }
  }

  if (errorPoints != "" && errorPoints != undefined) {
    var pointsArray = errorPoints.split(":");
    if (pointsArray != null && pointsArray.length > 0) {
      for (var j = 0; j < pointsArray.length; j++) {
        var pointStr = pointsArray[j];
        var pointarray = pointStr.split(",");
        var point = new OpenLayers.Geometry.Point(pointarray[0], pointarray[1]);
        var pointFeature = new OpenLayers.Feature.Vector(point);
        pointFeature.style = {
          strokeColor: "#011672",
          strokeWidth: 1,
          pointerEvents: "visiblePainted",
          fillColor: "red",
          fillOpacity: 0.4,
          pointRadius: 8
        };

        vectorLayer.addFeatures(pointFeature);
      }
    }
  }
}
