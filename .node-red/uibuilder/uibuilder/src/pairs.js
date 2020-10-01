/**
  A collection of functions to interact with PAIRS from a Front-END GUI using Leaflet

  Main purpose is to provide an extension to the leaflet TileLayer class to support PAIRS WMS tiling server
*/
const EPSG={'EPSG:3857':{'dx':20026376.39,'dy':20048966.10}}
const INIT_OPACITY=0.4

pairsFuncs= {
    setPairsData: function(geoServerURLOrID,minColor,maxColor,colorTableId,layerName) {
        // console.log('Setting pairs data to ',geoServerId,minColor,maxColor,colorTableId,layerName)
        this.geoServerURL=geoServerURLOrID.startsWith('http')?geoServerURLOrID:`https://${this.pairsHost}:${this.pairsPort}/${geoServerURLOrID}`
        this.minColor=minColor
        this.maxColor=maxColor
        this.colorTableId=colorTableId
        this.layerName=layerName
    },
    makePairsURL: function(z,x,y,geoServerURL,minColor,maxColor,colorTableId,layerName) {
        const proj='EPSG:3857'
        const imageFormat='png'
        const wpels=256
        const hpels=256

        // So, this should be the main WMS URL base
        var baseURL=`${geoServerURL}/pairs/wms?service=WMS&version=1.3.0&request=GetMap&format=image/${imageFormat}&transparent=true&transitionEffect=resize&width=${wpels}&height=${hpels}&crs=${proj}&styles=`

        zpow=2**z/2
        bbox_l=(x-zpow)*EPSG[proj]['dx']/zpow
        bbox_t=(zpow-y-1)*EPSG[proj]['dy']/zpow
        bbox_r=(x-zpow+1)*EPSG[proj]['dx']/zpow
        bbox_b=(zpow-y)*EPSG[proj]['dy']/zpow

        // Make-up the style layer descriptor and encode it
        var sld=`https://${PAIRS_HOST}:443/map/sld?type=raster&min=${minColor}&max=${maxColor}&colorTableId=${colorTableId}&no_data=-1&property=value&layer=pairs:${layerName}`
        sldEnc=encodeURIComponent(sld)

        // Finally build the full URL
        var fullURL=`${baseURL}&bbox=${bbox_l},${bbox_t},${bbox_r},${bbox_b}&layers=${layerName}&authorization=${this.pairsWMSAuth}&sld=${sldEnc}`

        //console.log(`WMS URL without bbox: ${baseURL}&layers=${layerName}&authorization=${auth}&sld=${sldEnc}`)
        return fullURL
    },
    getTileUrl: function(coords) {
        //console.log('Get PAIRS tile for coords ',coords)
        return this.makePairsURL(coords['z'],coords['x'],coords['y'],this.geoServerURL,this.minColor,this.maxColor,this.colorTableId,this.layerName)
    }
}

/** initialize the PAIRS extensions for Leaflet */
function initPAIRS(L,pairsHost,pairsPort,pairsWMSAuth) {
  pairsFuncs['pairsHost']=pairsHost
  pairsFuncs['pairsPort']=pairsPort
  pairsFuncs['pairsWMSAuth']=pairsWMSAuth
  L.TileLayer.Pairs = L.TileLayer.extend(pairsFuncs)
}

/** Create a PAIRS-backed WMS layer */
function newPAIRSLayer(L,geoServerURLOrId,minColor,maxColor,colorTableId,layerName,opacity) {
    newLayer=new L.TileLayer.Pairs()
    newLayer.setPairsData(geoServerURLOrId,minColor,maxColor,colorTableId,layerName)
    newLayer.setOpacity(opacity?opacity:INIT_OPACITY)

    return newLayer
}

/* Set up the map watching to communicate with Node-RED */
function addMapWatch(cScope,map,mapid,layers,fallBack) {
    sendMapDimensions=function(evt) {
        cScope.send({"dimChange" : {'type': evt.type, 'fromMapId': mapid, 'zoom': map.getZoom(), 'pos': map.getCenter()}})
    }

    map.on('moveend',sendMapDimensions)
    map.on('zoomend',sendMapDimensions)
    map.on('move',sendMapDimensions)

    // Debug layers names
    if(layers) {
        for (const [key, value] of Object.entries(layers)) {
            console.log("layer key ",key," val=", value);
        }

        for (var key in layers) {
            // check if the property/key is defined in the object itself, not in parent
            if (layers.hasOwnProperty(key)) {
                console.log("layer key ",key," val=", layers[key]);
            }
        }
    }

    cScope.$watch('msg',function(msg) {
        let refPointMarker

        function setRefPointMarker(pos) {
            if (refPointMarker) {
                map.removeLayer(refPointMarker);
            }

            let svgPin = '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><metadata id="metadata1">image/svg+xml</metadata><circle fill="#fe2244" cx="10" cy="10" r="9"/><circle fill="#ffffbf" cx="10" cy="10" r="5"/></svg>'
            refPointMarker=L.marker([pos.lat,pos.lng], {icon: L.icon({iconUrl: encodeURI(`data:image/svg+xml,${svgPin}`).replace(/\#/g,'%23'), iconSize: 20})}).bindPopup("Ref Point").addTo(map);
        }

        if(msg) {
            if("payload" in msg) {
                if("setDim" in msg.payload) {
                    console.log('setDim',msg.payload.setDim)
                    if(map.getZoom()!=msg.payload.setDim.zoom || map.getCenter()!=msg.payload.setDim.pos) {
                        map.setView(msg.payload.setDim.pos,msg.payload.setDim.zoom)
                    }
                    if("type" in msg.payload.setDim && msg.payload.setDim.type=='initMap') {
                        setRefPointMarker(msg.payload.setDim.pos)
                    }
                } else if("setOpacity" in msg.payload) {
                    console.log("Setting opcacity",msg.payload.setOpacity)
                    for (var name in layers) {
                        if (layers.hasOwnProperty(name)) {
                            if(name==msg.payload.setOpacity.layer) {
                                console.log("Setting layer ",name," opacity to  ",msg.payload.setOpacity.opacity)
                                layers[name].setOpacity(msg.payload.setOpacity.opacity)
                            }
                        }
                    }
                } else if("setRefPoint" in msg.payload) {
                    // Set the reference point with a marker
                    setRefPointMarker(msg.payload.setRefPoint.pos)
                    map.setView(msg.payload.setRefPoint.pos,map.getZoom())
                } else if(fallBack) {
                    fallBack(msg.payload,cScope,map,mapid,layers)
                }
            } else {
                console.log(`${mapid} unhandled msg, no payload: `,msg)
            }
        }
    });

    // Notify of init complete
    cScope.send({"initMap":mapid});
}

/* Function added to generate an event when the map is clicked
    This will also add a marker
*/
function addMapClick(cScope,map,mapid) {
  let marker
	map.on('click', function(evt) {
    cScope.send({"mousePos" :evt.latlng, "fromMapId":mapid});
    if (marker) {
      map.removeLayer(marker);
    };
    marker = L.circleMarker(evt.latlng).addTo(map);
  });
}

/* Create an Open Street Map leaflet
*/
function createOpenStreetMap(L,mapid,overlayMaps) {
  var map=L.map(mapid)

	const osmURL='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  osmLayer=L.tileLayer(osmURL,{maxZoom: 18,subdomains: ["maps1", "maps2", "maps3", "maps4"]}).addTo(map);

  L.control.layers({"OSM": osmLayer}, overlayMaps,{"hideSingleBase":true}).addTo(map);

  return map
}