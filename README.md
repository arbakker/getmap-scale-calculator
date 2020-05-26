# GetMap Scale Calculator 

Application to debug visibility of scale depedendent WMS layers. Calculates the scale denominator for a WMS request. 

Specify the DPI in the GetMap request by using the `MAP_RESOLUTION` query parameter. This query param is a MapServer vendor specific parameter. Other non-standard query parameters your WMS service might respond to are:

- `FORMAT_OPTIONS=dpi:72`
- `DPI=72`

Example WMS GetMap requests to use:

```
https://geodata.nationaalgeoregister.nl/bzk/bro-bodemkaart/wms/v1_0?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&layers=view_soil_area&CRS=EPSG%3A28992&STYLES=&WIDTH=1634&HEIGHT=1288&BBOX=171319.68%2C430456.32%2C193280.64%2C447767.04&TRANSPARENT=TRUEMAP_RESOLUTION=72&TRANSPARENT=TRUE
```
