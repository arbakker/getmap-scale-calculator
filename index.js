import WMSCapabilities from 'ol/format/WMSCapabilities'


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
    console.log(queryParams)
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

function fillDPIField(urlString){
    let dpiEl = document.getElementById("DPI")
    let dpiFromURL = getDPIFromUrl(urlString)
    if (! dpiFromURL){
        dpiFromURL = "72"
    }
    dpiEl.value = dpiFromURL
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
        console.log("URL does not contain MAP_RESOLUTION query parameter. Required to determine scale of GetMap request.")
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


function urlChanged(){
    let getMapUrl = getMapUrlEl.value
    if (! validate(getMapUrl)){
        return
    }

    document.getElementById("error").innerHTML = ""
    let getMapImageEl = document.getElementById("GetMapImage")
    let imageLoaderEl = document.getElementById("ImageLoader")
    getMapImageEl.src = ""
    let DPI = getDPIFromUrl(getMapUrl)

    getMapImageEl.addEventListener('load',loaded)
    getMapImageEl.addEventListener('error',loaded)
    
    getMapImageEl.style.border = "unset"
    imageLoaderEl.style.display = "block"
    getMapImageEl.src = getMapUrl
    let queryParams = getQueryParams(getMapUrl)
    let scales = calculateScale(queryParams, DPI)
    let resultEl = document.getElementById("result")
    

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


let getMapUrlEl = document.getElementById("GetMapUrl")
getMapUrlEl.addEventListener('input', urlChanged)
window.onload = urlChanged 