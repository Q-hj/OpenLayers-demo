<!-- GeoJSON -->
<script setup>
	import { onMounted, ref } from 'vue';
	import 'ol/ol.css';
	import Map from 'ol/Map';
	import TileArcGISRest from 'ol/source/TileArcGISRest';
	import TileLayer from 'ol/layer/Tile';
	import View from 'ol/View';
	import { Style, Stroke, Fill, Text } from 'ol/Style';
	import proj4 from 'proj4';
	import { register } from 'ol/proj/proj4';
	import { Projection, addProjection } from 'ol/proj';

	import { Vector as VectorLayer } from 'ol/layer';
	import { Vector as VectorSource } from 'ol/source';
	import GeoJSON from 'ol/format/GeoJSON';
	import { pattern } from './utils/colorLike';
	// import zjGeoJson from './assets/GeoJSON/浙江省.json';

	const colorConfig = [, '#6588e0', '#cce069', '#e0ab4a', '#e04f3f'];
	const sityData = {
		杭州市: 4,
		台州市: 2,
		绍兴市: 3,
	};
	const legendVisbility = ref(true);

	// * 批量导入GeoJSON
	const allJson = import.meta.glob('./assets/GeoJSON/*.json', { eager: true });
	// console.log(allJson);
	// * 组成cityGeoJson对象
	const cityGeoJson = {};
	Object.entries(allJson).map(([name, geoJson]) => {
		const endIndx = name.indexOf('.json');
		const cityName = name.slice(endIndx - 3, endIndx);
		cityGeoJson[cityName] = geoJson;
	});
	// console.log(cityGeoJson);

	let map = null;

	// EPSG:4490
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

	onMounted(() => {
		initMap().then(() => {
			// setTimeout(() => addLayer(Object.keys(cityGeoJson)), 1000);
			addLayer('浙江省');
		});
	});

	/**
	 * 添加区域geo图层
	 * @param {string| string[]} cityName:省、市名称 或其数组
	 */
	const addLayer = (cityName) => {
		if (!cityName) return;

		function addLayerItem(id) {
			const geoJson = cityGeoJson[id];
			if (!geoJson) return console.warn(`未找到${cityName}geoJson`);
			let geoLayer = new VectorLayer({
				id,
				name: 'geoJson',
				source: new VectorSource({
					features: new GeoJSON().readFeatures(geoJson),
				}),
				style: (feature) => {
					// console.log(feature);
					const { name } = feature.values_;

					const color = colorConfig[sityData[name] || 1];

					const showText = false; // Object.keys(cityGeoJson).includes(name);

					return new Style({
						stroke: new Stroke({
							color: 'rgba(34, 36, 54,0.3)',
							width: 1,
						}),
						fill: new Fill({
							color,
						}),
						text: new Text({
							textAlign: 'center', //位置
							textBaseline: 'middle', //基准线
							font: `normal 14px 微软雅黑`, //文字样式
							text: showText && feature.values_.name, //文本内容
							fill: new Fill({
								color: '#ffffff',
							}),
							// stroke: new Stroke('#bab281'),
						}),
					});
				},
			});
			// 添加GeoJSON到map上
			map.addLayer(geoLayer);
		}

		// 移除原先geoJson图层
		removeLayer('geoJson');

		// 添加单个区域json
		addLayerItem(cityName);

		// 设置当前geoJson的中心点和范围及zoom
		setViewByLayer(cityName);
	};

	const removeLayer = (name) => {
		const getAllLayers = map.getLayers().getArray();
		const toRemoveLayers = name ? getAllLayers.filter((e) => e.values_.name == name) : getAllLayers;
		toRemoveLayers.forEach((e) => map.removeLayer(e));
	};
	//   getCurrentView() {
	//     const center = this.map.map.getView().targetCenter_;
	//     const zoom = this.map.map.getView().getZoom();
	//     return [center, zoom];
	//   }
	// 初始化地图，返回promise，便于在then中写回调
	const initMap = () => {
		return new Promise((resolve) => {
			map = new Map({
				layers: [
					// Gis发布wms图层
					new TileLayer({
						opacity: 0.7,
						source: new TileArcGISRest({
							url: 'https://124.222.96.104:6443/arcgis/rest/services/cdlbserver/MapServer',
						}),
					}),
				],
				target: 'map',
				view: new View({
					center: [120.1, 29.2], // 浙江
					projection: 'EPSG:4490',
					zoom: 8,
					maxZoom: 18,
					minZoom: 1,
					enableRotation: false,
				}),
			});
			// 鼠标点击事件
			map.on('singleclick', (e) => {
				const features = map.getFeaturesAtPixel(e.pixel);

				if (!features.length) return;
				const { name } = features[0].values_;

				if (!name) return;
				// setViewByLayer(name);
				const isCity = Object.keys(cityGeoJson).includes(name);
				isCity && addLayer(name);
			});
			// 监听视角
			map.on('moveend', (e) => {
				const zoom = map.getView().getZoom(); //获取当前地图的缩放级别

				const getAllLayers = map.getLayers().getArray();
				// const isProvinceLevel = getAllLayers.some((e) => e.values_.id == '浙江省');

				// 省:8  市:9.5
				if (zoom < 9) addLayer('浙江省');
				legendVisbility.value = zoom < 9;
			});

			resolve();
		});
	};
	// 根据图层设置视角为它的中心点
	const setViewByLayer = (layerId) => {
		const flag = Object.keys(cityGeoJson).includes(layerId);
		if (!flag) {
			const parentCity = Object.entries(cityGeoJson).filter(([name, { features }]) => {
				const names = features.map((e) => e.properties.name);
				return names.includes(layerId);
			});
			if (!parentCity.length) return;

			layerId = parentCity[0][0];
		}
		const getAllLayers = map.getLayers().getArray();
		const current = getAllLayers.filter((e) => e.values_.id == layerId);

		if (!current[0]) return;

		const extent = current[0].getSource().getExtent();
		const center = getCenterByExtent(extent);
		// map.getView().setCenter(center);
		const zoom = layerId.includes('省') ? 8 : 9.5;
		const duration = layerId.includes('省') ? 500 : 600;
		map.getView().animate({
			center,
			zoom,
			duration,
		});
	};
	// 根据区域范围计算中心点
	const getCenterByExtent = ([x0, y0, x1, y1]) => {
		const x = x0 + (x1 - x0) / 2;
		const y = y0 + (y1 - y0) / 2;
		return [x, y];
	};
</script>

<template>
	<div class="warp">
		<div id="map">
			<div
				class="legend"
				v-show="legendVisbility"
			>
				<p>图例</p>
				<ul>
					<li
						v-for="(item, i) in colorConfig.slice(1)"
						:key="i"
					>
						<div
							class="color"
							:style="{ background: item }"
						></div>
						<span>{{ ['良好', '正常', '警告', '严重'][i] }}</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.warp {
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(176, 169, 169, 0.1);
	}
	#map {
		background-color: #fff;
		width: 1200px;
		height: 800px;
		border: 1px solid #b0a9a9;
		box-shadow: 0 0 10px #b0a9a9;
		position: relative;
	}
	.legend {
		position: absolute;
		right: 50px;
		bottom: 30px;
		padding: 0 30px;
		border: 1px solid #b0a9a9;
	}
	.legend > p {
		line-height: 70px;
		font-size: 20px;
		text-align: center;
	}
	ul {
		display: flex;
		flex-direction: column-reverse;
	}
	li {
		list-style: none;
		display: flex;
		margin-bottom: 20px;
	}
	li > .color {
		width: 50px;
		height: 30px;
	}
	li > span {
		line-height: 30px;
		margin-left: 20px;
	}
</style>
