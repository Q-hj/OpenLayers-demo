<!-- 打点 -->
<script setup>
	import { onMounted } from 'vue';
	import 'ol/ol.css';
	import Feature from 'ol/Feature';
	import { Circle, LineString, Point } from 'ol/geom';
	import { Icon, Style, Stroke, Text } from 'ol/style';

	import Map from 'ol/Map';
	import XYZ from 'ol/source/XYZ';
	import Overlay from 'ol/Overlay';
	import TileArcGISRest from 'ol/source/TileArcGISRest';
	import TileLayer from 'ol/layer/Tile';
	import View from 'ol/View';
	import WMTS from 'ol/source/WMTS';
	import WMTSTileGrid from 'ol/tilegrid/WMTS';
	import { getTopLeft, getWidth } from 'ol/extent';
	import proj4 from 'proj4';
	import { register } from 'ol/proj/proj4';
	import { Projection, addProjection } from 'ol/proj';
	import { Vector as VectorLayer } from 'ol/layer';
	import { Vector as VectorSource } from 'ol/source';
	import { toLonLat } from 'ol/proj';
	import { toStringHDMS } from 'ol/coordinate';

	let map = null;

	// 坐标系注册 EPSG:4490
	proj4.defs(
		'EPSG:4490',
		'GEOGCS["China Geodetic Coordinate System 2000",DATUM["China_2000",SPHEROID["CGCS2000",6378137,298.257222101,AUTHORITY["EPSG","1024"]],AUTHORITY["EPSG","1043"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4490"]]'
	);
	register(proj4);

	var projection = new Projection({
		code: 'EPSG:4490',
		units: 'degrees',
		axisOrientation: 'neu',
	});
	projection.setExtent([-180, -90, 180, 90]);
	projection.setWorldExtent([-180, -90, 180, 90]);
	addProjection(projection);

	let projectionExtent = projection.getExtent();
	let size = getWidth(projectionExtent) / 256; // size就是一个像素代表的经纬度
	let matrixIds = [];

	function getResolutions() {
		let resolutions = [];
		for (let z = 0; z < 20; ++z) {
			resolutions[z] = size / Math.pow(2, z);
			matrixIds[z] = z;
		}
		return resolutions;
	}

	// 画圆
	const circleFeature = new Feature({
		geometry: new Circle([120.6, 29.5], 1),
	});
	circleFeature.setStyle(
		new Style({
			renderer(coordinates, state) {
				const [[x, y], [x1, y1]] = coordinates;
				const ctx = state.context;
				const dx = x1 - x;
				const dy = y1 - y;
				const radius = Math.sqrt(dx * dx + dy * dy);

				const innerRadius = 0;
				const outerRadius = radius * 1.4;

				const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
				gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
				gradient.addColorStop(0.6, 'rgba(255, 0, 0, 0.2)');
				gradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');
				ctx.beginPath();
				ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
				ctx.fillStyle = gradient;
				ctx.fill();

				ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
				ctx.strokeStyle = 'rgba(255,0,0,1)';
				ctx.stroke();
			},
		})
	);
	// 划线
	const lineFeature = new Feature({
		geometry: new LineString([
			[120.175106, 30.118679],
			[120.1581, 30.108657],
			[120.097855, 30.078793],
			[120.041321, 30.042957],
			[119.990228, 30.014587],
			[119.959224, 29.995177],
			[119.930097, 29.969794],
			[119.886357, 29.938438],
			[119.850783, 29.916847],
			[119.808118, 29.887545],
			[119.769038, 29.856702],
			[119.758297, 29.847372],
			[119.730379, 29.822433],
			[119.6936, 29.792725],
			[119.639329, 29.745818],
			[119.604378, 29.70673],
			[119.56063, 29.666078],
			[119.527385, 29.634806],
			[119.495879, 29.606662],
			[119.457316, 29.580082],
			[119.415155, 29.564445],
			[119.380006, 29.553499],
			[119.1414896, 29.4351802],
			[118.8000668, 29.1844165],
			[118.5663707, 29.0754458],
			[118.4778424, 29.0244268],
			[118.4286733, 28.988197],
			[118.2990252, 28.8430627],
			[118.2196908, 28.7453079],
			[118.0488325, 28.65729],
			[117.9297494, 28.6365799],
			[117.8106663, 28.5796271],
			[117.7174708, 28.558917],
			[117.6035653, 28.4864317],
			[117.5103698, 28.450189],
		]),
	});
	// lineFeature.setStyle(
	// 	new Style({
	// 		stroke: new Stroke({
	// 			color: '#fd8b2b',
	// 			width: 3,
	// 		}),
	// 		text: new Text({
	// 			font: '16px sans-serif', // 字体大小及类型
	// 			text: '萧山-球川断裂', // 文本内容或富文本
	// 			textBaseline: 'middle', // 文本基线
	// 			overflow: false, // 文本超出几何体最大宽度后溢出部分隐藏
	// 		}),
	// 		// TextPath: new TextPath({})
	// 	})
	// );
	// 打点
	const pointFeature = new Feature({
		geometry: new Point([120.161443, 30.272179]),
		name: '杭州大厦',
	});
	pointFeature.setStyle(
		new Style({
			image: new Icon({
				anchor: [0.5, 160],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				src: '/楼房.png',
				scale: 0.2,
			}),
		})
	);

	const newLayer = new VectorLayer({
		source: new VectorSource({
			features: [lineFeature],
			// features: [circleFeature, lineFeature]
		}),
	});
	newLayer.setStyle(
		new Style({
			stroke: new Stroke({
				color: '#fd8b2b',
				width: 3,
			}),
			text: new Text({
				placement: 'line', //默认为'point'
				repeat: 0, //重复间隔（以像素为单位）
				rotateWithView: true,
				font: '16px sans-serif', // 字体大小及类型
				text: '萧山-球川断裂', // 文本内容或富文本
				textBaseline: 'middle', // 文本基线
				overflow: false, // 文本超出几何体最大宽度后溢出部分隐藏
			}),
			// TextPath: new TextPath({})
		})
	);

	onMounted(() => {
		/**
		 * Elements that make up the popup.
		 */
		const container = document.getElementById('popup');
		const content = document.getElementById('popup-content');
		const closer = document.getElementById('popup-closer');

		/**
		 * Create an overlay to anchor the popup to the map.
		 */
		const overlay = new Overlay({
			element: container,
			autoPan: true,
			autoPanAnimation: {
				duration: 250,
			},
		});

		/**
		 * Add a click handler to hide the popup.
		 * @return {boolean} Don't follow the href.
		 */
		closer.onclick = function () {
			overlay.setPosition(undefined);
			closer.blur();
			return false;
		};

		map = new Map({
			layers: [
				// // 省域空间
				// new TileLayer({
				//   source: new WMTS({
				//     url: 'https://sdi.zjzwfw.gov.cn/services/wmts/imgmap/default/oss?token=sy-5a35dff6-179f-4c7f-9f32-0f9c64a5327b',
				//     layer: 'imgmap',
				//     version: '1.0.0',
				//     style: 'default',
				//     matrixSet: 'esritilematirx',
				//     format: 'image/jpgpng',
				//     wrapX: true,
				//     tileGrid: new WMTSTileGrid({
				//       origin: getTopLeft(projectionExtent),
				//       resolutions: getResolutions(),
				//       matrixIds: matrixIds
				//     })
				//   })
				// }),
				// Gis发布wms图层
				new TileLayer({
					opacity: 0.7,
					source: new TileArcGISRest({
						url: 'https://124.222.96.104:6443/arcgis/rest/services/cdlbserver/MapServer',
					}),
				}),
				newLayer,
				// new VectorLayer({
				//   source: new VectorSource({
				//     features: [pointFeature]
				//   })
				// })
			],
			overlays: [overlay],
			target: 'map',
			view: new View({
				center: [120.6, 29.5], // 浙江
				projection: 'EPSG:4490',
				zoom: 7,
				maxZoom: 18,
				minZoom: 1,
				enableRotation: false,
			}),
		});

		// 地图点击事件
		map.on('click', function (evt) {
			const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
				return feature;
			});
			console.log(feature.get('name'));
			if (feature && feature.get('name') === '杭州大厦') {
				const coordinate = evt.coordinate;
				const hdms = toStringHDMS(toLonLat(coordinate));
				// content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>'
				content.innerHTML = `<p>建筑名称：杭州大厦</p>
	                          <p>中外合资多功能大楼</p>
	                          <p>建筑层数：26层</p>
	                          <p>经纬度：${hdms}</p>
	     `;
				overlay.setPosition(coordinate);
			}
		});

		// 控制鼠标点状态变化
		map.on('pointermove', function (evt) {
			const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
				return feature;
			});
			map.getTargetElement().style.cursor =
				map.hasFeatureAtPixel(evt.pixel) && feature.get('name') === '杭州大厦' ? 'pointer' : '';
		});
	});

	// 打开省域空间wmts能力文档
	// setTimeout(() => {
	//   window.open(
	//     'https://sdi.zjzwfw.gov.cn/services/wmts/imgmap/default/oss?token=sy-5a35dff6-179f-4c7f-9f32-0f9c64a5327b&Request=GetCapabilities&service=WMS'
	//   )
	// }, 2000)
</script>

<template>
	<div
		id="map"
		class="map"
	></div>
	<div
		id="popup"
		class="ol-popup"
	>
		<a
			href="#"
			id="popup-closer"
			class="ol-popup-closer"
		></a>
		<div id="popup-content"></div>
	</div>
</template>

<style scoped>
	.map {
		width: 100vw;
		height: 100vh;
	}
	.ol-popup {
		position: absolute;
		background-color: white;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
		padding: 15px;
		border-radius: 10px;
		border: 1px solid #cccccc;
		bottom: 12px;
		left: -50px;
		min-width: 280px;
	}
	.ol-popup:after,
	.ol-popup:before {
		top: 100%;
		border: solid transparent;
		content: ' ';
		height: 0;
		width: 0;
		position: absolute;
		pointer-events: none;
	}
	.ol-popup:after {
		border-top-color: white;
		border-width: 10px;
		left: 48px;
		margin-left: -10px;
	}
	.ol-popup:before {
		border-top-color: #cccccc;
		border-width: 11px;
		left: 48px;
		margin-left: -11px;
	}
	.ol-popup-closer {
		text-decoration: none;
		position: absolute;
		top: 2px;
		right: 8px;
	}
	.ol-popup-closer:after {
		content: '✖';
	}
</style>
