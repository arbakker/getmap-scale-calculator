import WMSCapabilities from 'ol/format/WMSCapabilities'
import { Map, View } from 'ol'
import WMTSSource from 'ol/source/WMTS'
import WKT from 'ol/format/WKT'
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer'
import {Vector as VectorSource} from 'ol/source';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js'
import { register } from 'ol/proj/proj4.js'
import { transform } from 'ol/proj'
import ExtentInteraction from 'ol/interaction/Extent'
import Translate from 'ol/interaction/Translate'
import {Circle as Fill, Stroke, Style} from 'ol/style';
import {defaults as defaultInteractions, Select} from 'ol/interaction'
import proj4 from 'proj4'
import Projection from 'ol/proj/Projection'
import { getTopLeft } from 'ol/extent.js'
import 'ol/ol.css'

const vectorSource = new VectorSource({projection: 'EPSG:28992'})
const vector = new VectorLayer({
    title: 'vector',
    style: vectorStyle,
    source: vectorSource
})

// interaction
var translateInteraction = new Translate(
    {layers: [vector]}
)

translateInteraction.on("translateend", function(e){
    const extent = e.features.getArray()[0].getGeometry().getExtent()
    const bbox = extent.join(',')
    updateBboxUrl(bbox)
})

// extentInteraction
var extentInteraction = new ExtentInteraction()
extentInteraction.setActive(false)
translateInteraction.setActive(true)

// add map
const BRTA_ATTRIBUTION = 'Kaartgegevens: © <a href="http://www.cbs.nl">CBS</a>, <a href="http://www.kadaster.nl">Kadaster</a>, <a href="http://openstreetmap.org">OpenStreetMap</a><span class="printhide">-auteurs (<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>).</span>'
proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs')
register(proj4)
const rdProjection = new Projection({
  code: 'EPSG:28992',
  extent: [-285401.92, 22598.08, 595401.92, 903401.92]
})

const resolutions = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420, 0.210]
const matrixIds = new Array(15)
for (var i = 0; i < 15; ++i) {
  matrixIds[i] = i
}

function getWmtsLayer (layername) {
  return new TileLayer({
    type: 'base',
    title: `${layername} WMTS`,
    extent: rdProjection.extent,
    source: new WMTSSource({
      url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts',
      layer: layername,
      matrixSet: 'EPSG:28992',
      format: 'image/png',
      attributions: BRTA_ATTRIBUTION,
      projection: rdProjection,
      tileGrid: new WMTSTileGrid({
        origin: getTopLeft(rdProjection.getExtent()),
        resolutions: resolutions,
        matrixIds: matrixIds
      }),
      style: 'default'
    })
  })
}
const vectorStyle = new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  })


const brtGrijsWmtsLayer = getWmtsLayer('brtachtergrondkaartgrijs')

const map = new Map({
    //select, modify
  interactions: defaultInteractions().extend([ translateInteraction, extentInteraction]),
  layers: [
    brtGrijsWmtsLayer, 
    vector
  ],
  target: document.getElementById("map"),
  view: new View({
    center: transform([5.43, 52.18], "EPSG:4326", 'EPSG:28992'),
    zoom: 8,
    projection: 'EPSG:28992'
  })
})




// app code
function updateBboxUrl(bboxString){
    let getMapUrl = getMapUrlEl.value
    if (! validate(getMapUrl)){
        return
    }
    let queryParams = getQueryParams(getMapUrl)
    queryParams.BBOX = bboxString

    let newGetMapUrl = rebuildGetMapUrl(getMapUrl, queryParams)
    getMapUrlEl.value = newGetMapUrl
    urlChanged()
}


function rebuildGetMapUrl(getMapUrl, queryParams) {
    const urlObj = new URL(getMapUrl)
    let newGetMapUrl = `${urlObj.protocol}//${urlObj.host}:${urlObj.port}${urlObj.pathname}?`
    let queryString = ''
    Object.keys(queryParams).forEach(function (key) {
        if (key && queryParams[key] !== undefined) {
            queryString += `&${key}=${queryParams[key]}`
        }
    })
    newGetMapUrl += queryString
    return newGetMapUrl
}

function getImageRatio(){
    let getMapUrl = getMapUrlEl.value
    let queryParams = getQueryParams(getMapUrl)
    return queryParams.WIDTH/queryParams.HEIGHT
}

function calculateScale(queryParams, DPI){
    let widthMapPixels = queryParams["WIDTH"]
    let heightMapPixels = queryParams["HEIGHT"]

    let bboxArray = queryParams["BBOX"].split(",")
    let widthReal = bboxArray[2] - bboxArray[0]
    let heightReal = bboxArray[3] - bboxArray[1]

    let widthMapInches = widthMapPixels/DPI
    let heightMapInches = heightMapPixels/DPI

    let widthMapMeters = (widthMapInches * 2.54)/100
    let heightMapMeters = (heightMapInches * 2.54)/100

    let scaleX = Math.round(widthReal / widthMapMeters)
    let scaleY = Math.round(heightReal / heightMapMeters)
    return {"scaleX": scaleX, "scaleY": scaleY}
}

function getQueryParams(urlString){
    let getMapUrlObject = new URL(urlString)
    let queryParams = {}
    let queryString = decodeURIComponent(getMapUrlObject.search)
    if (queryString.indexOf("?") === 0){
        queryString = queryString.substr(1)
    }
    queryString.split("&").forEach(function(el){
        let key = el.split("=")[0].toUpperCase()
        let value = el.split("=")[1]
        queryParams[key]=value
    })
    return queryParams
}

function isValidHttpUrl(urlString) {
    let url
    try {
      url = new URL(urlString)
    } catch (_) {
      return false
    }
    return url.protocol === "http:" || url.protocol === "https:"
}

function isValidGetMapUrl(urlString){
    let queryParams = getQueryParams(urlString)
    if ("BBOX" in queryParams && queryParams.BBOX  && 
    "REQUEST" in queryParams && queryParams.REQUEST.toUpperCase() === "GETMAP" &&
    "SERVICE" in queryParams && queryParams.SERVICE.toUpperCase() === "WMS" &&
    "VERSION" in queryParams && queryParams.VERSION === "1.3.0" &&
    "WIDTH" in queryParams && queryParams.WIDTH &&
    "HEIGHT" in queryParams && queryParams.HEIGHT &&
    "LAYERS" in queryParams && queryParams.LAYERS &&
    "CRS" in queryParams && queryParams.CRS === "EPSG:28992"
    ){
        return true
    }
    return false
}

function containsOneLayer(urlString){
    let queryParams = getQueryParams(urlString)
    if (queryParams.LAYERS.indexOf(",") === -1){
        return true
    }
    return false
}

function containsMapResolutionParam(urlString){
    let queryParams = getQueryParams(urlString)
    if ("MAP_RESOLUTION" in queryParams && ! isNaN(queryParams.MAP_RESOLUTION)){
        return true
    }
    return false
}


function getDPIFromUrl(urlString){
    // multiple parameters are in use to specify dpi
    // DPI=96&MAP_RESOLUTION=72&FORMAT_OPTIONS=dpi:96
    // mapserver uses MAP_RESOLUTION
    let queryParams = getQueryParams(urlString)
    if ("MAP_RESOLUTION" in queryParams){
        return queryParams.MAP_RESOLUTION
    }
    return ""
}

function validate(getMapUrl){
    if (!getMapUrl){
        // do nothing if url empty
        return false
    }

    if (! isValidHttpUrl(getMapUrl)){
        console.log("Not a valid url provided")
        document.getElementById("error").innerHTML = "Not a valid url provided"
        return false
    }

    if (! isValidGetMapUrl(getMapUrl)){
        console.log("Not a valid WMS GetMap 1.3.0 url provided")
        document.getElementById("error").innerHTML = "Not a valid WMS GetMap 1.3.0 url provided"
        return false
    }

    if (! containsMapResolutionParam(getMapUrl)){
        console.log("URL does not contain MAP_RESOLUTION query parameter. Required to determine scale of GetMap request. For example \"MAP_RESOLUTION=72\".")
        document.getElementById("error").innerHTML = "URL does not contain MAP_RESOLUTION query parameter. Required to determine scale of GetMap request."
        return false
    }

    if (!containsOneLayer(getMapUrl)){
        console.log("GetMap request contains more than one layer, application can only validate GetMap requests with a single layer.")
        document.getElementById("error").innerHTML = "GetMap request contains more than one layer, application can only validate GetMap requests with a single layer."
        return false
    }
    return true
}

function zoomTo(){
    let fts = vectorSource.getFeatures()
    console.log(fts)
    if (fts.length > 0){
        map.getView().fit(fts[0].getGeometry(), {padding: [50,50,50,50]})
    }
}

document.getElementById("zoomto").addEventListener("click", zoomTo)

function updateBbox(queryParams){
    if (extentInteraction){
        map.removeInteraction(extentInteraction)
    }
    let bbox = queryParams.BBOX.split(",")
    let wktString = `POLYGON((${bbox[0]} ${bbox[1]}, ${bbox[2]} ${bbox[1]}, ${bbox[2]} ${bbox[3]},${bbox[0]} ${bbox[3]},${bbox[0]} ${bbox[1]}))`
    let format = new WKT({dataProjection: 'EPSG:28992'})
    let feature = format.readFeature(wktString, { 
        dataProjection: 'EPSG:28992',
        featureProjection: 'EPSG:28992'})

    vectorSource.clear()
    vectorSource.addFeature(feature)
    extentInteraction = new ExtentInteraction({
        extent:  feature.getGeometry().getExtent()
    })
    extentInteraction.setActive(false);
    window.addEventListener('keydown', function(event) {
        if (event.keyCode == 16) {
            extentInteraction.setActive(true);
            
        }
      });
    window.addEventListener('keyup', function(event) {
    if (event.keyCode == 16) {
        extentInteraction.setActive(false);
        let extent =  extentInteraction.getExtent()
        let ratio = getImageRatio()
        let dX = extent[2]-extent[0]
        let newDY = dX/ratio
        let newMaxY = extent[1]+ newDY
        let newExtent = [extent[0], extent[1], extent[2], newMaxY ]
        let bbox = newExtent.join(",")
        updateBboxUrl(bbox)
    }
    })
    map.addInteraction(extentInteraction)
   
}

function syncDPIParams(){
    let getMapUrl = getMapUrlEl.value
    let queryParams = getQueryParams(getMapUrl)
    let dpi = queryParams.MAP_RESOLUTION
    queryParams["DPI"] = dpi
    queryParams["FORMAT_OPTIONS"] = `dpi:${dpi}`
    let newGetMapUrl = rebuildGetMapUrl(getMapUrl, queryParams)
    getMapUrlEl.value = newGetMapUrl
}


function urlChanged(){
    syncDPIParams()
    let getMapUrl = getMapUrlEl.value
    if (! validate(getMapUrl)){
        return
    }

    document.getElementById("error").innerHTML = ""
    let getMapImageEl = document.getElementById("GetMapImage")
    let imageLoaderEl = document.getElementById("ImageLoader")
    getMapImageEl.src = ""
    getMapImageEl.style.display = "block"
    let DPI = getDPIFromUrl(getMapUrl)

    getMapImageEl.addEventListener('load',loaded)
    getMapImageEl.addEventListener('error',loaded)
    
    getMapImageEl.style.border = "unset"
    imageLoaderEl.style.display = "block"
    getMapImageEl.src = getMapUrl
    let queryParams = getQueryParams(getMapUrl)
    let scales = calculateScale(queryParams, DPI)
    let resultEl = document.getElementById("result")

    updateBbox(queryParams)

    const capUrl = getCapabilitiesURL(getMapUrl)
    const parser = new WMSCapabilities()
    fetch(capUrl).then(function (response) {
        return response.text()
    }).then(function (text) {
        var result = parser.read(text)
        let layers = []
        layers = unpackLayers(result.Capability, layers)
        let maxScale
        let minScale
        layers.forEach(function (lyr) {
            if (lyr.Name === queryParams.LAYERS){
                minScale = lyr.MinScaleDenominator
                maxScale = lyr.MaxScaleDenominator
            }
        })
        let htmlString = `<b>ScaleDenominator: </b>${scales["scaleX"]}<br><b>DPI: </b>${DPI}<br><b>Layer: </b>${queryParams.LAYERS}`
        if (maxScale){
            htmlString += `<br><b>MaxScaleDenominator: </b>${maxScale}`
        }
        if (minScale){
            htmlString += `<br><b>MinScaleDenominator: </b>${minScale}`
        }
        htmlString += `<br><a href="${capUrl}">Capabilities Document</a>`
        resultEl.innerHTML = htmlString
    })
}

function loaded() {
    let imageLoaderEl = document.getElementById("ImageLoader")
    let getMapImageEl = document.getElementById("GetMapImage")
    imageLoaderEl.style.display = "none"
    getMapImageEl.style.border = "solid 1px"
}

function getCapabilitiesURL(getMapUrl){
    const urlObj = new URL(getMapUrl)
    const serviceURL = `${urlObj.protocol}//${urlObj.host}:${urlObj.port}${urlObj.pathname}`
    const capUrl = `${serviceURL}?service=WMS&request=GetCapabilities`
    return capUrl
}

function unpackLayers(capObj, result){
    if (!Array.isArray(capObj)){
      capObj = [capObj]
    }
    capObj.forEach(function(lyr){
      if ("Layer" in lyr){
        unpackLayers(lyr.Layer, result)
      }else{
        result.push(lyr)
      }
    })
    return result 
  }



var getMapUrlEl = document.getElementById("GetMapUrl")
getMapUrlEl.addEventListener('blur', urlChanged)
window.onload = urlChanged