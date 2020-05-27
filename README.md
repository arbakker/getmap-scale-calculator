# GetMap Scale Calculator 

Application to debug visibility of scale dependent WMS layers. Calculates the scale denominator for a WMS request. 

Specify the DPI in the GetMap request by using the `MAP_RESOLUTION` and the `FORMAT_OPTIONS=dpi:` query parameters. These query param are MapServer specific AFAIK. MapServer does not seem to respond to the query param `DPI`.

Example WMS GetMap requests to use:

bro-bodemkaart:
```
https://geodata.nationaalgeoregister.nl/bzk/bro-bodemkaart/wms/v1_0?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&layers=view_soil_area&CRS=EPSG%3A28992&STYLES=&WIDTH=1634&HEIGHT=1288&BBOX=171319.68%2C430456.32%2C193280.64%2C447767.04&TRANSPARENT=TRUE&MAP_RESOLUTION=72&FORMAT_OPTIONS=dpi:72
```

kadastralekaartv3:
```
https://geodata.nationaalgeoregister.nl/kadastralekaartv3/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&layers=perceel&CRS=EPSG%3A28992&STYLES=&WIDTH=2881&HEIGHT=1247&BBOX=190289.61%2C442282.47%2C191499.63%2C442806.20999999996&MAP_RESOLUTION=96&FORMAT_OPTIONS=dpi:96
```
