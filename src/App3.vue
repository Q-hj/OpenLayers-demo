<!-- 图层叠加 -->
<script setup>
import { onMounted } from 'vue'
import 'ol/ol.css'
import Map from 'ol/Map'
import XYZ from 'ol/source/XYZ'
import TileArcGISRest from 'ol/source/TileArcGISRest'
import TileLayer from 'ol/layer/Tile'
import View from 'ol/View'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { getTopLeft, getWidth } from 'ol/extent'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'
import { Projection, addProjection } from 'ol/proj'

let map = null

proj4.defs(
  'EPSG:4490',
  'GEOGCS["China Geodetic Coordinate System 2000",DATUM["China_2000",SPHEROID["CGCS2000",6378137,298.257222101,AUTHORITY["EPSG","1024"]],AUTHORITY["EPSG","1043"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4490"]]'
)
register(proj4)

var projection = new Projection({
  code: 'EPSG:4490',
  units: 'degrees',
  axisOrientation: 'neu'
})
projection.setExtent([-180, -90, 180, 90])
projection.setWorldExtent([-180, -90, 180, 90])
addProjection(projection)

let projectionExtent = projection.getExtent()
let size = getWidth(projectionExtent) / 256 //size就是一个像素代表的经纬度
let matrixIds = []

function getResolutions() {
  let resolutions = []
  for (let z = 0; z < 20; ++z) {
    resolutions[z] = size / Math.pow(2, z)
    matrixIds[z] = z
  }
  return resolutions
}

onMounted(() => {
  map = new Map({
    layers: [
      // 省域空间
      new TileLayer({
        source: new WMTS({
          url: 'https://sdi.zjzwfw.gov.cn/services/wmts/imgmap/default/oss?token=sy-5a35dff6-179f-4c7f-9f32-0f9c64a5327b',
          layer: 'imgmap',
          version: '1.0.0',
          style: 'default',
          matrixSet: 'esritilematirx',
          format: 'image/jpgpng',
          wrapX: true,
          tileGrid: new WMTSTileGrid({
            origin: getTopLeft(projectionExtent),
            resolutions: getResolutions(),
            matrixIds: matrixIds
          })
        })
      }),
      // Gis发布wms图层
      new TileLayer({
        opacity: 0.7,
        source: new TileArcGISRest({
          url: 'https://124.222.96.104:6443/arcgis/rest/services/cdlbserver/MapServer'
        })
      })
    ],
    target: 'map',
    view: new View({
      center: [120.6, 29.5], // 浙江
      projection: 'EPSG:4490',
      zoom: 7,
      maxZoom: 18,
      minZoom: 1,
      enableRotation: false
    })
  })
})

// 打开省域空间wmts能力文档
// setTimeout(() => {
//   window.open(
//     'https://sdi.zjzwfw.gov.cn/services/wmts/imgmap/default/oss?token=sy-5a35dff6-179f-4c7f-9f32-0f9c64a5327b&Request=GetCapabilities&service=WMS'
//   )
// }, 2000)
</script>

<template>
  <div id="map" class="map"></div>
</template>

<style scoped>
.map {
  width: 100vw;
  height: 100vh;
}
</style>
