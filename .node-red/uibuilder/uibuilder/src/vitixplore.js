/**
 * Copyright 2020 IBM Corp.
 *
 * Original UIBuilder template Copyright (c) 2019 Julian Knight (Totally Information)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
'use strict'

/** @see https://github.com/TotallyInformation/node-red-contrib-uibuilder/wiki/Front-End-Library---available-properties-and-methods */
const PAIRS_HOST='pairs.res.ibm.com'
const PAIRS_PORT=8080
const PAIRS_WMS_AUTH='jGn23qJeqcCVeFaRot2duWirS6bl052bxLjdSisZWVjlSadbmAWAfc30SUd9L-GxPBIZ-TulkhNL1LAl-J_Sjmf-j7TUEqpIHj4kZ1flCBHmOs6aNmw_qkT1YrtYhYLDmmJktFoRfpfW9GeCaD41Ed21bVw2XOWyBLHVn4kf43rMqI326lp7vxJGGjmZlXjtBFfUFvhoh7gYEZgnWB-mk-506RyWVqQ3rc4J0AusaRRbh6xg_D4DXbjSqqO4q9ft1SY8xNjiqAQO4Nde0QcEHdY_DU54WheQP_vmw8a_C4Q5KSNlQ4oA_X4A3XXcHiMjtLszKAi3hCa0jvj3MmLAm0xyhA1OhNgKWCkUHG53wIee7FqRKSeMfjQEHDpLVxUVWL2L99ZYxO-vt8gL2UA6y68yExwlVnVQMOe3yL-nfflwM_Jo8QPK46gC5ogbmEhr9xJFswwGG7BcUNdnXMAFADBmVoCfl6KpEW4wvXjBfYy7fWED93Tmsq1SdPMX_gIPEfkvT2ZTG_iL-4i_eCa91OffwkQlu0FON0hioVTtdgtZ-fHFfxn9A7lL0NOqV2yTRel1ZFue93HYI3ZWYSRZSdZJjt3mSX7lLDXtzD2iCSraSI3gG8wZyRO8gBu4ttA7wF3qrbneBbxWnpMwX1EHv2n9N4h9DglgfwZZob54U4I'
const PAIRS_MAPID='vitiMap'

const INIT_LAT = 49.0808 //47.45
const INIT_LNG = 3.9621 // 3.5
const INIT_ZOOM = 5

const AOIS_CATEGORY = 'FRA'

const ZERO_C_IN_K = -273.15

const MONTHS_BACK = 1
const AREAS_COLOR='#633CEA'

const DEFAULT_FLYTO_SEC = 2
const LONG_FLYTO_SEC = 5

const SIMUL_QUERYID = '1601956800_33355820'
const DEFAULT_COLORTABLEID = 4

const SCORING_LAYER_NAMES=['Overall Scoring','scoring'] // Tha names we use to identify our scoring UDF layer
const DIMENSIONS_NAMES=['depth']  // name of dimensions that are processed

// Register l-map components
console.debug("Registering Vue2Leaflet components")

/* Initialize Vue bindings for Leaflet */
Vue.component('l-map', window.Vue2Leaflet.LMap);
Vue.component('l-tilelayer', window.Vue2Leaflet.LTileLayer);
Vue.component('l-wms-tile-layer', window.Vue2Leaflet.LWMSTileLayer);
Vue.component('l-control-layers', window.Vue2Leaflet.LControlLayers);
Vue.component('l-marker', window.Vue2Leaflet.LMarker);
Vue.component('l-rectangle', window.Vue2Leaflet.LRectangle);

// Vue.use()
/* This is the auth token for PAIRS WMS, actually not used, works without... */
// const wms_authorization='jGn23qJeqcCVeFaRot2duWirS6bl052bxLjdSisZWVjlSadbmAWAfc30SUd9L-GxPBIZ-TulkhNL1LAl-J_Sjmf-j7TUEqpIHj4kZ1flCBHmOs6aNmw_qkT1YrtYhYLDmmJktFoRfpfW9GeCaD41Ed21bVw2XOWyBLHVn4kf43rMqI326lp7vxJGGjmZlXjtBFfUFvhoh7gYEZgnWB-mk-506RyWVqQ3rc4J0AusaRRbh6xg_D4DXbjSqqO4q9ft1SY8xNjiqAQO4Nde0QcEHdY_DU54WheQP_vmw8a_C4Q5KSNlQ4oA_X4A3XXcHiMjtLszKAi3hCa0jvj3MmLAm0xyhA1OhNgKWCkUHG53wIee7FqRKSeMfjQEHDpLVxUVWL2L99ZYxO-vt8gL2UA6y68yExwlVnVQMOe3yL-nfflwM_Jo8QPK46gC5ogbmEhr9xJFswwGG7BcUNdnXMAFADBmVoCfl6KpEW4wvXjBfYy7fWED93Tmsq1SdPMX_gIPEfkvT2ZTG_iL-4i_eCa91OffwkQlu0FON0hioVTtdgtZ-fHFfxn9A7lL0NOqV2yTRel1ZFue93HYI3ZWYSRZSdZJjt3mSX7lLDXtzD2iCSraSI3gG8wZyRO8gBu4ttA7wF3qrbneBbxWnpMwX1EHv2n9N4h9DglgfwZZob54U4I'
/* This is the URL to retrieve the colortable and layer styling from PAIRS WMS server */
// const wms_sld='https%3A%2F%2Fpairs.res.ibm.com%2Fmap%2Fsld%3Ftype%3Draster%26min%3D0%26max%3D39%26colorTableId%3D4%26no_data%3D0%26layer%3Dpairs%3A1607576400_31103119Expression-OverallScoringOverallScoring-Exp'

// eslint-disable-next-line no-unused-vars
var appViti = new Vue({
    el: '#appViti',
    data: {
        curPage     : 1,
        isDev : window.location.search.search(/.*[?&]dev/i)>=0,
        tileProviders: [
          { name: 'OpenStreetMap', visible: true, key:'open.streetMap',
            attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          },
          { name: 'OpenTopoMap', visible: false, key:'open.topoMap',
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
          },
          { name: 'Google Street Map', visible: false, key:'google.streetMap',
            url: "https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}",
            attribution: "Google-Street-Map"
          },
          { name: 'Google Sat Map', visible: false, key:'google.satMap',
            url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            attribution: "Google-Sat-Map"
          },
          { name: 'Google Hybrid Map', visible: false, key:'google.hybridMap',
            url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
            attribution: "Google-Hybrid-Map"
          },
          // { name: 'Six Aerial', visible: false, key:'six.aerial',
          //   url: "http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}",
          //   attribution: "Six-Aerial"
          // }
        ],
        wmsLayers: [
          { name : "TOPO-WMS",
            baseUrl : "http://ows.mundialis.de/services/service?",
            layers : 'TOPO-WMS',
            attribution : 'Mundialis',
            visible : false
          },
          { name : "OSM-WMS",
            baseUrl :"http://ows.mundialis.de/services/service?",
            layers : 'OSM-Overlay-WMS',
            attribution : 'Mundialis',
            visible : false
          },
          { name : "TOPO+OSM-WMS",
            baseUrl : "http://ows.mundialis.de/services/service?",
            layers : 'TOPO-WMS,OSM-Overlay-WMS',
            attribution : 'Mundialis',
            visible : false
          },
          // { name : "PAIRS Test",
          //   // baseUrl : `https://pairs.res.ibm.com:8080/geoserver06/pairs/wms?sld=${wms_sld}&authorization=${wms_authorization}&`,
          //   baseUrl : `https://pairs.res.ibm.com:8080/geoserver06/pairs/wms?sld=${wms_sld}&`,
          //   // baseUrl : `https://pairs.res.ibm.com:8080/geoserver06/pairs/wms?`,
          //   layers : '1607576400_31103119Expression-OverallScoringOverallScoring-Exp',
          //   attribution : 'PAIRS',
          //   visible : false
          // },
          // "https://pairs.res.ibm.com:8080/geoserver06/pairs/wms?service=WMS&version=1.3.0&request=GetMap&format=image/png&transparent=true&transitionEffect=resize&width=256&height=256&crs=EPSG:3857&styles=&bbox=2191602.4749925737,10921272.234207656,2504688.5428486555,11233308.583756447&layers=1607576400_31103119Expression-OverallScoringOverallScoring-Exp
          // &authorization=${this.wms_authorization}
          //
          // { name : "Weather Data",
          //   baseUrl : "http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi",
          //   layers : 'nexrad-n0r-900913',
          //   visible : false
          // }
        ],
        layersDict  : null, // Dict of layers indexed by layerID
        aoisDict    : null,
        aoisArray    : [],
        test: {l:{Min:20,Mean:50,Max:100},so:0.20,sx:0.5},
        // ---- Current position and dates
        refPos      : {lat : INIT_LAT, lng : INIT_LNG},
        startDay    : new Date(new Date()-1000*3600*24*30.5*MONTHS_BACK).toISOString().split("T")[0],  // About 6 months back
        endDay      : new Date().toISOString().split("T")[0],
        refAOI      : null,
        ///############## Query
        qryRunning  : false, // true while query is running
        qryPos      : null,
        qryLayers   : null,
        // ---- Map variables
        locationMap : null,  // The Leaflet map for the first page
        mapCenter   : {lat : INIT_LAT, lng : INIT_LNG},
        mapZoom     : INIT_ZOOM,
        refPointMarker: null,
        // Area selection, access the layer only through setAreaSelLayer()
        _areaSelLayer: null,
        rectanglePos: null,
        rectangleBtnIsPressed: false,
        // Scoring query management
        scoringMap    : null, // The Leaflet map for the scoring (last) page
        scoring       : {inProgress : false},
        scoringLayerOpacity  : INIT_OPACITY*100,
        queryJobs     : null,
        selQueryJob   : null,
        qrySelAll     : false,
        colorTableId  : DEFAULT_COLORTABLEID,
        // -- Criteria selection
        critOff: 0.2, // slider offset ratio
        critExt: 0.5,  // slider extent ratio
        // Criteria slider values, will be a dict keyed by layer ID with a Low-Up array each
        criteriasRange   : null,
        criteriasCheck   : null,
        critDigits  : 2,
        // -- Misc
        feVersion   : '',
        socketConnectedState : false,
        serverTimeOffset     : '[unknown]',
        imgProps             : { width: 75, height: 75 },
        allColorMaps: null,
        myToggle: false,
        pairsWMSLayers: null,
        legend: null,
        // -- Specific layers values
        soilTypes : [{ value: "1", text: 'Coarse' }, { value: "2", text: 'Medium' }, { value: "3", text: 'Medium fine' }, { value: "4", text: 'Fine' }, { value: "5", text: 'Very fine' }, { value: "6", text: 'Organic' }, { value: "7", text: 'Tropical organic' }],
        refSoilType: null,
        soilClass : [ { value: "0", text: 'Acrisols' },  { value: "1", text: 'Albeluvisols' },  { value: "2", text: 'Alisols' },  { value: "3", text: 'Andosols' },  { value: "4", text: 'Arenosols' },  { value: "5", text: 'Calcisols' },  { value: "6", text: 'Cambisols' },  { value: "7", text: 'Chernozems' }, { value: "8", text: 'Cryosols' }, { value: "9", text: 'Durisols' }, { value: "10", text: 'Ferralsols' }, { value: "11", text: 'Fluvisols' }, { value: "12", text: 'Gleysols' }, { value: "13", text: 'Gypsisols' }, { value: "14", text: 'Histosols' }, { value: "15", text: 'Kastanozems' }, { value: "16", text: 'Leptosols' }, { value: "17", text: 'Lixisols' }, { value: "18", text: 'Luvisols' }, { value: "19", text: 'Nitisols' }, { value: "20", text: 'Phaeozems' }, { value: "21", text: 'Planosols' }, { value: "22", text: 'Plinthosols' }, { value: "23", text: 'Podzols' }, { value: "24", text: 'Regosols' }, { value: "25", text: 'Solonchaks' }, { value: "26", text: 'Solonetz' }, { value: "27", text: 'Stagnosols' }, { value: "28", text: 'Umbrisols' }, { value: "29", text: 'Vertisols' }],
        refSoilClass: null,
        depths: ["0to5cm","5to15cm","15to30cm","30to60cm","60to100cm", "100to200cm"]

    }, // --- End of data --- //
    watch:{
        scoringLayerOpacity: function(opacity,oldOpacity) {
          // console.log(`opacity changed ${opacity} - ${oldOpacity}`)
          if(this._shownScoringLayer) {
            this._shownScoringLayer.setOpacity(this.scoringLayerOpacity/100)
          }
        }
    },
    computed: {
        hLastRcvd: function() {
            var msgRecvd = this.msgRecvd
            if (typeof msgRecvd === 'string') return 'Last Message Received = ' + msgRecvd
            else return 'Last Message Received = ' + this.syntaxHighlight(msgRecvd)
        },
        hLastSent: function() {
            var msgSent = this.msgSent
            if (typeof msgSent === 'string') return 'Last Message Sent = ' + msgSent
            else return 'Last Message Sent = ' + this.syntaxHighlight(msgSent)
        },
        hLastCtrlRcvd: function() {
            var msgCtrl = this.msgCtrl
            if (typeof msgCtrl === 'string') return 'Last Control Message Received = ' + msgCtrl
            else return 'Last Control Message Received = ' + this.syntaxHighlight(msgCtrl)
        },
        hLastCtrlSent: function() {
            var msgCtrlSent = this.msgCtrlSent
            if (typeof msgCtrlSent === 'string') return 'Last Control Message Sent = ' + msgCtrlSent
            //else return 'Last Message Sent = ' + this.callMethod('syntaxHighlight', [msgCtrlSent])
            else return 'Last Control Message Sent = ' + this.syntaxHighlight(msgCtrlSent)
        },
    }, // --- End of computed --- //
    methods: {
      slideStart: function() {
        console.log("Slide Start")
      },
      slideStop: function() {
        console.log("Slide Stop")
      },
      sendToNodered: function(topic,payload) {
        uibuilder.send( {'topic': topic, 'payload': payload} )
      },
      initMap: function(event) {
        this.sendToNodered('initMap',{'point': {'lat':this.refLat, 'lng': this.refLng}})
      },
      initLayers: function() {
        this.sendToNodered('initLayers',{})
      },
      initializedLayers: function(layers,pairsError) {
        // We got the details list of layers (array in msg.payload)
        this.layersDict=layers.reduce(function(dict,layer,index) {
          dict[layer.id]=layer
          return dict},
          {})
      },
      loadAOIs: function(AOICategory) {
        this.sendToNodered('loadAOIs',AOIS_CATEGORY)
      },
      loadedAOIs: function(aois,pairsError) {
        // console.debug("loadAOIs",msg.payload)
        // We got the details list of AOIs, put them in a dict
        this.aoisDict=aois.reduce(function(dict,aoi,index) {
          // Adjust name
          if(aoi.name.startsWith(AOIS_CATEGORY+'_')) {
            aoi.name=aoi.name.slice(1+AOIS_CATEGORY.length)
          }
          aoi.name=capitalize(aoi.name,"-_")
          dict[aoi.name]=aoi
          return dict},
        {})

        // Create an array with the name of the AOIs, so we can sort it alphabetically
        Object.entries(this.aoisDict).forEach(([key, aoi], index) =>
          this.aoisArray[index] = aoi.name
        );
        this.aoisArray.sort();
      },
      loadedPolygons: function(aois,pairsError) {
        // We get the polygons for the AOIs that should already be loaded
        for(const a in aois) {
          const aoi=aois[a]

          for(const n in this.aoisDict) {
            if(this.aoisDict[n].id==aoi.id) {
              // add the poly to the existing dict's AOI
              try {
                this.aoisDict[n]['poly']=JSON.parse(aoi.poly)
              } catch(exc) {
                console.warn(`Exception ${exc} parsing`,aoi.poly)
              }
              break
            }
          }
        }
      },
      loadLayers: function(event) {
        // this.sendToNodered('loadLayers', {'pos': this.refPos, 'startDay' : this.startDay, 'endDay' : this.endDay, 'layers': Object.keys(this.layersDict)})
        this.sendToNodered('loadLayers', {'pos': this.refPos, 'startDay' : this.startDay, 'endDay' : this.endDay, 'layers': this.layersDict})
        this.qryRunning=true
      },
      loadedLayers: function(layers,pairsError) {
        if(!pairsError) {
          console.debug('Got layers',layers)

          // Set the Query position
          this.qryPos={"lat": layers[0].latitude, "lng":layers[0].longitude}

          // first group all the layers by layer ID and flatten Min-Mean-Max
          const _layersDict=this.layersDict
          this.qryLayers=layers.reduce(function(qryLayersAcc,layer) {
            // Note: qryLayersAcc is the accumulator of the map function for the qryLayers dictionary that we build from the layers
            if(!(layer.layerId in qryLayersAcc)) {
              // First time we encounter this layerID, add it to the dict
              qryLayersAcc[layer.layerId]={"name": layer.layerName, "id":layer.layerId, "dataset": layer.dataset}
              // append attributes from layersDict
              const LAYERS_ATTR=['description_short','description_long','datatype','units', 'dimensions_description', 'measurement_interval']
              LAYERS_ATTR.forEach(attribute => qryLayersAcc[layer.layerId][attribute]=_layersDict[layer.layerId][attribute])
            }

            // Store value based on layer kind
            const value=toHumanUnit(layer.value,qryLayersAcc[layer.layerId]['units'])
            qryLayersAcc[layer.layerId]['humanUnits']=getHumanUnit(qryLayersAcc[layer.layerId]['units'])
            if(layer.property) {
              const depthProperty = layer.property.split("depth:");

              qryLayersAcc[layer.layerId][depthProperty[1]]=value
            } else if (layer.aggregation) {
              qryLayersAcc[layer.layerId][layer.aggregation]=value
            } else {
              qryLayersAcc[layer.layerId]["Mean"]=value
            }
            return qryLayersAcc
          },{})
          this.initCriterias(this.critOff,this.critExt)
          // switch to second page
          this.curPage=2
        }

        // in any case, cancel the wait
        this.qryRunning=false
      },
      initCriterias: function(offset,extent) {
        if(this.qryLayers!=null) {
          const _this=this
          this.criteriasRange=Object.keys(this.qryLayers).reduce(function(acc,layerId){

            if ((_this.qryLayers[layerId].measurement_interval == '0 years 0 mons 0 days 0 hours 0 mins 0.00 secs') || (_this.qryLayers[layerId].measurement_interval == '0 years 0 mons 0 days 0 hours 0 mins 0.0 secs')) {
              if (_this.qryLayers[layerId].dimensions_description) {
                acc[layerId]=_this.slPosDim(_this.qryLayers[layerId], offset,extent)
              } else {
                // acc[layerId]=_this.slPos(_this.qryLayers[layerId],['Lower','Upper'],offset,extent)
                acc[layerId]=_this.slPos(_this.qryLayers[layerId],['MeanLower','MeanUpper'],offset,extent)
              }
            } else {
              acc[layerId]=_this.slPos(_this.qryLayers[layerId],['Lower','Upper'],offset,extent)
            }

            if(layerId == 50450) _this.refSoilType = _this.qryLayers[layerId].Mean;
            if(layerId == 50511) _this.refSoilClass = _this.qryLayers[layerId].Mean;

            return acc
          },{})
          this.criteriasCheck=Object.keys(this.qryLayers).reduce(function(acc,layerId){
            acc[layerId]=true
            return acc
          },{})
        } else {
          this.criteriasRange=null
          this.criteriasCheck=null
        }
      },
      critChange: function(layerId,critIndex,value) {
        var criteriasRange=this.criteriasRange
        const _this=this
        console.log(`critChange ${layerId}[${critIndex}] value=${value} criteriasRange[layerId]=${criteriasRange[layerId]}`)
        Vue.nextTick(function () {
          console.log(`nextTick critChange ${layerId}[${critIndex}] value=${value} criteriasRange[layerId]=${criteriasRange[layerId]}`)
          criteriasRange[layerId][critIndex]=parseFloat(value)
          _this.criteriasRange=criteriasRange
          console.log(`critChange new ${_this.criteriasRange[layerId]}`)
          // const event = new Event('input')
          // var refid=`c${critIndex}_${layerId}`
          // var ref=this.$refs[refid]
          // console.log('looking up ref ',refid, ' got ', ref)
          // ref.value = 'something'
          // ref.dispatchEvent(event)
          _this.test.z=value
        })
      },
      moveTo: function(event) {
        this.locationMap.flyTo(this.refPos,this.locationMap.getZoom()+1)
      },
      onMapReady: function(mapRef) {
        console.log(`On map ready`,mapRef)
        // Tie some map events to a callback function
        if(mapRef==='vitiMap') {
          const vitiMap =this.$refs[mapRef].mapObject;
          ['moveend','zoomend','move','click'].forEach(evtType=>vitiMap.on(evtType,this.handleMapEvent))
          this.locationMap=vitiMap

          // this.locationMap.on('zoomend',this.handleMapEvent)
          // this.locationMap.on('move',this.handleMapEvent)
          // this.locationMap.on('click',this.handleMapEvent)

          this.setView(this.mapCenter,this.mapZoom)
          this.setRefPointMarker(this.refPos)
        } else if(mapRef==='areaSelMap') {
          this.areaSelMap=this.$refs[mapRef].mapObject
          this.areaSelMap.on('click', this.setRectangle)
          // add the reference marker
          addRefPointMarker(this.refPos,this.areaSelMap)
        } else if(mapRef==='scoringMap') {
          this.scoringMap=this.$refs[mapRef].mapObject
          this.scoringMap.on('baselayerchange', this.changeLegend); // If we change the layer display, we call the changeLegend function
          addRefPointMarker(this.refPos,this.scoringMap)

          // at this stage, either we are running an existing query, so we know the bounds,
          // or we have launched a query and we will know the bounds on the first status later
          this.flyToScoring()

          const areaLayer=this.scoring.poly ? L.geoJSON(this.scoring.poly) :
                          this.scoring.bounds ? L.rectangle(this.scoring.bounds, {color: AREAS_COLOR, weight: 1}) :
                          null
          if(areaLayer) {
            const _this=this
            areaLayer.bindPopup("Scoring Area")
            this.scoringMap.on('zoomend',function() {
              console.log('Scoring area zoomend')
              areaLayer.addTo(_this.scoringMap)
            })
          }
        }
      },
      setView: function(pos,zoom) {
        this.locationMap.setView(pos,zoom?zoom:this.locationMap.getZoom())
      },
      addLayers: function(lMap,wmsLayers) {
        if(this.isDev) {
          console.log(`addLayers to Leaflet map ${lMap}`)
          console.log('Adding WMS layers from ',wmsLayers)
        }

        pairsOverlays={}

        wmsLayers.forEach(layer => pairsOverlays[layer.datalayer]=newPAIRSLayer(L,layer.geoserverUrl,layer.min,layer.max,layer.colorTableId,layer.name))

        console.log("Adding WMS overlays ",pairsOverlays)
        L.control.layers(null, pairsOverlays).addTo(lMap);
      },
      handleMapEvent: function(event) {
        if(this.isDev) console.log('mapEvent evt:',event)
        // keep tracks of last center and zoom position
        this.mapCenter=this.locationMap.getCenter()
        this.mapZoom=this.locationMap.getZoom()
        var eventName='map'+event.type.charAt(0).toUpperCase() + event.type.slice(1)
        this.sendToNodered(eventName,{'pos':('latlng' in event)?event.latlng:this.mapCenter, 'zoom':this.mapZoom})
      },
      setRefPointMarker: function(pos) {
        // remove marker
        if (this.refPointMarker) {
            this.locationMap.removeLayer(this.refPointMarker);
            this.refPointMarker=null
        }
        // add new marker
        this.refPointMarker=addRefPointMarker(pos,this.locationMap)
        this.refPos=pos
      },
      setAreaSelLayer: function(areaSelLayer) {
        // first remove the old layer no matter what
        if(this.areaSelMap) {
          // first remove previous marker
          if(this._areaSelLayer) {
            this.areaSelMap.removeLayer(this._areaSelLayer)
            this._areaSelLayer=null
          }
          // then add to areaSelMap
          this._areaSelLayer=areaSelLayer
          if(areaSelLayer) {
            areaSelLayer.addTo(this.areaSelMap)
          }
        } else {
          console.error("Expected areaSelMap but it is null or undefined")
          this._areaSelLayer=null
        }
      },
      // Function to create a rectangle on the map on page 2 - filters and regions
      setRectangle: function (pos) {
        if (this.rectangleBtnIsPressed) {
          // Step 1 : get first point, when no rectangle exists or when there is already a full rect
          if (this.rectanglePos === null || this.rectanglePos[1]!==null) {
            this.rectanglePos=[{"lat" : pos.latlng['lat'], "lng": pos.latlng['lng']},null] // save first corner pos
            // this.setAreaSelLayer(svgMarker(pos.latlng,4,svgDisk(5,5,4,AREAS_COLOR),"Area Corner"))
            this.setAreaSelLayer(svgMarker(pos.latlng,20,svgCrossHair(20,20,AREAS_COLOR),"Area Corner"))
          } else if (this.rectanglePos[1]==null) {
            // Step 2 : draw rectangle
            // store second corner of rect
            this.rectanglePos[1] = {"lat" : pos.latlng['lat'], "lng": pos.latlng['lng']} // save pos
            this.setAreaSelLayer(L.rectangle([[this.rectanglePos[0].lat, this.rectanglePos[0].lng], [this.rectanglePos[1].lat, this.rectanglePos[1].lng]], {color: AREAS_COLOR, weight: 1}).bindPopup("Area Selection"))
          } else {
            // Step 3 : reset
            this.rectanglePos = null
            this.setAreaSelLayer(null)
          }
        } else {
          // Step 3 : reset
          this.rectanglePos = null
          this.setAreaSelLayer(null)
        }
      },
      // Triggered when we click on rectangle on page 2 - filters and regions
      chooseRectangle: function () {
        this.rectanglePos = null
        this.setAreaSelLayer(null)
        this.refAOI = null // If the user chooses a rectangle selection, we remove the aoi
      },
      // Triggered when we select an aoi on page 2 - filters and regions
      chooseAoi: function () {
        // If the user chooses an AOI, we remove the current area selection
        if(this.rectangleBtnIsPressed) {
          this.rectangleBtnIsPressed = false;

          this.rectanglePos = null;
          this.setAreaSelLayer(null)
        }

        //
        const aoi=this.aoisDict[this.refAOI]
        if(aoi && 'poly' in aoi) {
          this.setAreaSelLayer(L.geoJSON(aoi.poly))
        } else {
          console.warn(`No polygon for AOI`,aoi)
        }
      },
      launchScoringQuery: function() {
        // Make a dictionary with low-up-enabled values
        const _this=this

        // Get only layers IDs that are selected
        const layerIds=Object.keys(this.criteriasCheck)
        console.log(this.criteriasCheck)

        // Create an array with values selected in sliders on page 2 - filters and regions
        const scoringData=layerIds.map(function(layerId) {
          if (_this.criteriasCheck[layerId]) {
            // Keep only enabled layers
            const layer=_this.qryLayers[layerId]
            const humanUnits=layer.humanUnits;
            const criteriaRange=_this.criteriasRange[layerId]
            if (layer.dimensions_description !== undefined) {
              // Layer with depths
              return {'id': layerId,
                      'depths': _this.depths.map(function(depth) { return {'name':depth,
                                                                  'lower':fromHumanUnits(criteriaRange[depth][0],humanUnits),
                                                                  'upper':fromHumanUnits(criteriaRange[depth][1],humanUnits)}})
                     }
            // } else if((layerId == "50450") || (layerId == "50511" )) {
            } else if(layer.units===undefined || layer.units==='categorical') {
              // Categorical layer
              return {'id':layerId,'category': layer.Mean}
            } else {
              // regular layer
              return {'id':layerId,
                      'lower':fromHumanUnits(criteriaRange[0],humanUnits),
                      'upper':fromHumanUnits(criteriaRange[1],humanUnits)}
            }
          } else {
            return null
          }
        })

        // In the function before, we create a new array with parameter from selected layers, if layer not selected we get undefined, we want to remove them from the array
        if(this.isDev) {
          console.log('scoringData',scoringData)
          console.log('qryLayers',this.qryLayers)
        }

        // Build an array of filters, skipping empty entries
        const UDFFilters = scoringData.reduce(function(filters,scoring) {
          if(scoring) { // note that reduce() should not invoke on empty elements
            if(scoring.depths) {
              // Create a filter for each depth
              return filters.concat(scoring.depths.map(depth=>`$${depth.name}_${scoring.id} >= ${depth.lower} && $${depth.name}_${scoring.id} <= ${depth.upper}`))
            } else if (scoring.category) {
              // categorical layer
              filters.push(`$Mean_${scoring.id} == ${scoring.category}`)
            } else {
              // regular layer
              filters.push(`$Mean_${scoring.id} >= ${scoring.lower} && $Mean_${scoring.id} <= ${scoring.upper}`)
            }
            return filters
          }
        },[]) // start with an empty array

        // add ternary operator for each filter, and join expression with +
        const UDF=`(${UDFFilters.map(filter=>`((${filter}) ? 1 : 0)`).join(' + ')})*100/${UDFFilters.length}`
        if(this.isDev) console.log('UDF=',UDF)

        const qryPos=(this.rectanglePos)?this.formatCoordinates(this.rectanglePos):this.qryPos
        const aoi=this.aoisDict[this.refAOI]
        this.sendToNodered('scoringQuery',
              {'pos': qryPos , 'aoi':aoi,
               'startDay':this.startDay,'endDay':this.endDay,
               'layers':scoringData,'udf':UDF, 'layerInfo': this.qryLayers})

        this.scoring={'inProgress':true,'exPercent':0,'status':'Launched'}
        if(aoi) {
          this.scoring.poly=aoi.poly
        } else if(qryPos) {
          this.scoring.bounds=[[qryPos.rSouth,qryPos.rWest],[qryPos.rNorth,qryPos.rEast]]
        }
        this.selQueryJob=null // no more selected query job
        this.pairsWMSLayers=null
        this.legend=null
        this.curPage=3
      },
      flyToScoring: function() {
        if(this.scoring.bounds && !this.scoring.flown) {
          // if(!this.scoring.bounds || (newBounds && [0,1].some(x=>[0,1].some(y=>newBounds[x][y]!=this.scoring.bounds[x][y])))) {
          console.log(`Flying to scoring bounds`,this.scoring.bounds)
          this.scoringMap.flyToBounds(this.scoring.bounds,{'animate':true,'duration':LONG_FLYTO_SEC})
          this.scoring.flown=true
        } else {
          console.log(`Cannot fly to scoring no bounds`)
        }
      },
      progressScoringQuery: function(progress,pairsError) {
        console.debug("progressScoringQuery",progress,pairsError)
        this.scoring.status=progress.status
        this.scoring.start=progress.start
        this.scoring.since=Date.now()-progress.start
        this.scoring.ready=progress.ready
        this.scoring.exPercent=progress.exPercent
        this.scoring.bounds=boundsFromPairs(progress)
        this.flyToScoring()

        if(['Initializing','Queued','Running','Writing'].includes(progress.status)) {
          // still running
          if(this.isDev) console.log(`Query progress status ${progress.status}`,progress)
        } else {
          if(progress.status==='Succeeded') {
            // Send a request to PAIRS through Node-RED backend to get the WMS layers definitions and subsequently add them to map
            this.sendToNodered('scoringLayers',progress.id)
          } else if(progress.status==='Failed' || progress.status==="FailedConversion") {
            console.warn("Failed Query Job",progress)
          } else {
            // unknown status
            console.warn("Unknown QueryJob Status:",progress.status)
          }
          // Mark scoring process as completed
          this.scoring={'inProgress':false}
        }
      },
      deletedQuery: function(payload,pairsError) {
        // Reload the Queries list
      },
      receivedResults: function(payload,pairsError) {
        if(pairsError===null && this.isDev) {
            console.log('PAIRS returned payload',payload)
        }

        if(payload.status==='Failed' || payload.status==='Success') {
          // query completed
          this.scoring={'inProgress':false}
        }
      },
      /* This is invoked when results of scoring and WMS layers come back from PAIRS through Node-RED backend */
      scoredLayers: function(colorMaps, pairsWMSLayers, pairsError) {
        const _this=this
        this.pairsWMSLayers = {}  // The WMS datalayers from PAIRS

        // The colorMaps and dataLayers have the same indexing, add the colorMap to the layer
        const layersArray=pairsWMSLayers.reduce(function(layers,pairsWMSLayer,i) {
          const layerName=pairsWMSLayer.name
          const layerId=pairsWMSLayer.datalayerId

          // Store the layer in a dict indexed by full layerName
          _this.pairsWMSLayers[layerName]=pairsWMSLayer

          // Find out which unit is used
          const unit = (_this.layersDict && layerId !== undefined)? _this.layersDict[layerId].units : "%"

          // get color for legend from colorMap at same index
          const colorTableId=colorMaps[i].colorTableId
          // Convert the colortables from WMS (XML converted to JSON dict, hence the .$),
          // to a flatter JSON colormap representation, and map to human units
          const colorMap=(colorMaps.length!=pairsWMSLayers.length)?null:
            colorMaps[i].colorMap.map(function(colorEntry) {
              // Label is the unit, map to human-readable values
              colorEntry.$.label=toHumanUnit(colorEntry.$.label,unit)
              return colorEntry.$
            })

          // Store the colorTable for the layer
          pairsWMSLayer["colorTable"]={"id":colorTableId,"map":colorMap}
          if(!colorMap) {
            console.warn(`Cannot map layers to colorTables ${pairsWMSLayers.length}<>${colorMaps.length}`)
          }

          var layerDesc=pairsWMSLayer.datalayer.split('[')[0]

          // Create the Leaflet layer for the WMS entry
          const newLayer=newPAIRSLayer(L,pairsWMSLayer.geoserverUrl,pairsWMSLayer.min,pairsWMSLayer.max,colorTableId,layerName, unit, layerDesc)

          // If this is a multi-dimensions layer, compose name
          if("dimensions" in pairsWMSLayer) {
            // We know that the second dimension can be e.g. 'depth'
            const dimName=pairsWMSLayer.dimensions[1]['name']
            if(DIMENSIONS_NAMES.includes(dimName)) {
              var dimOption=pairsWMSLayer.dimensions[1]['options'][0]

              layerDesc=`${layerDesc} (${dimName}: ${humanize(dimOption)})`
            }
          }

          // Find the Scoring layer and add it to the map to make it visible, and setup legend
          // make the scoring layer visible
          if(SCORING_LAYER_NAMES.includes(layerDesc)) {
            // insert as first layer
            layers.unshift([newLayer,layerDesc])

            // add to the map makes the layer visible
            _this.scoringMap.addLayer(newLayer);

            // setup current legend data
            _this.legend={"humanUnits": getHumanUnit(unit), "name": layerDesc, "colorMap": colorMap}
            _this.setShownScoringLayer(newLayer)
          } else {
            layers.push([newLayer,layerDesc])
          }

          return layers
        },[])

        // Create a Layers Control to add to the Map
        // Add the leaflet PAIRS layer to the layers control
        const layersControl=layersArray.reduce((control,layer) => control.addBaseLayer(layer[0],layer[1]),
                                               L.control.layers()) // created and passed to reduce iterations

        // Finally, add the Layers Control to the map
        layersControl.addTo(this.scoringMap)
      },
      listQueryJobs: function() {
        this.sendToNodered('listQueryJobs',null)
      },
      listedQueryJobs: function(queryJobs,pairsError) {
        // Process list of listQueryJobs
        this.queryJobs=queryJobs.queryJobList
      },
      showQueryJob: function() {
        // Existing query, inject it to the query process
        this.scoring={'inProgress':true,'bounds':boundsFromPairs(this.selQueryJob)}

        // Try to figure out the AOI or Rect from the name
        const qryName=this.selQueryJob.nickname
        if(qryName.startsWith('VitXplore_')) {
          try {
            const coords=qryName.match(/.*_Rect\[([0-9\.]+);([0-9\.]+);([0-9\.]+);([0-9\.]+)\]_.*/)
            if(coords && coords.length==5) {
              // found a rectangle
              this.scoring.bounds=[[Number.parseFloat(coords[1]),Number.parseFloat(coords[2])],
                                   [Number.parseFloat(coords[3]),Number.parseFloat(coords[4])]]
            } else {
              const aoi=qryName.match(/.*_([a-zA-Z\-]+)_\[([0-9\.]+);([0-9\.]+)\]_.*/)
              if(aoi && aoi.length==4) {
                this.scoring.aoi=this.aoisDict[aoi[1]]
                if(this.scoring.aoi) this.scoring.poly=this.scoring.aoi.poly
                this.refPos={'lat':Number.parseFloat(aoi[2]),'lng':Number.parseFloat(aoi[3])}
              }
            }
          } catch(exc) {
            console.warn('Parsing error on ',qryName,exc)
          }
        }
        this.sendToNodered('scoringQuery', {'id':this.selQueryJob.id})
        this.curPage=3
      },
      deleteQueryJob: function() {
        // Invalidate current list
        this.queryJobs=null
        this.sendToNodered('deleteQueryJob',this.selQueryJob.id)
        this.selQueryJob=null
      },
      deletedQueryJob: function() {
        // Reload QueryJobs List
        this.listQueryJobs()
      },
      // Coordinates needs to be formated in a certain way when amking a call to PAIRS
      formatCoordinates: function (rectPos) {
        // square pos to send to PAIRS = [southernmost latitude, westernmost longitude, northernmost latitude, easternmost longitude]
        const qryPos={}
        if (rectPos[0].lat > rectPos[1].lat) {
          qryPos["rSouth"] = rectPos[1].lat;
          qryPos["rNorth"] = rectPos[0].lat;
        } else {
          qryPos["rSouth"] = rectPos[0].lat;
          qryPos["rNorth"] = rectPos[1].lat;
        }

        if (rectPos[0].lng > rectPos[1].lng) {
          qryPos["rWest"] = rectPos[1].lng;
          qryPos["rEast"] = rectPos[0].lng;
        } else {
          qryPos["rWest"] = rectPos[0].lng;
          qryPos["rEast"] = rectPos[1].lng;
        }
        return qryPos
      },
      slPos: function(layer, pos, offset,extent,normalize) {  // pos can be Inf, Min, Lower,  Mean, Upper, Max, Sup
        const critDigits=this.critDigits

        //There are two functions in this function
        function _f(p) {
          switch(p) {
            case 'Inf':
              return (layer.Min-(layer.Mean-layer.Min)*extent)
            case 'Min':
              return layer.Min
            case 'Lower':
              return (layer.Mean-(layer.Mean-layer.Min)*offset)
            case 'Mean':
              return layer.Mean
            case 'Upper':
              return (layer.Mean+(layer.Max-layer.Mean)*offset)
            case 'Max':
              return layer.Max
            case 'Sup':
              return (layer.Max+(layer.Max-layer.Mean)*extent)
            case 'MeanLower':
              return (layer.Mean-layer.Mean*offset)
            case 'MeanUpper':
              return (layer.Mean+layer.Mean*offset)
            default:
              console.warn(`Invalid call to slPos(${layer},${pos},${offset},${extent})`)
              return -1
            }
          }
        function _rnd(p) {
          return  Math.round(_f(p) * (10**critDigits)) / (10**critDigits)
        }

        // if pos is an array, map for each element of the array
        var slPos=(Array.isArray(pos))?pos.map(_rnd):_rnd(pos)
        // if normalize has been asked, get every thing in the 0-normalize range (for the positions)
        if(normalize) {
          // We assume the elements are in order
          slPos=slPos.map(v => normalize*((v-slPos[0])/(slPos[slPos.length-1]-slPos[0])))
        }
        return slPos
      },
      slPosDim: function(layer, offset,extent,normalize) {
        const critDigits=this.critDigits
        var slPos = {}, roundedValue = 0;

        this.depths.map(function (depth) {
          roundedValue = Math.round(layer[depth]);
          slPos[depth] = [roundedValue - roundedValue*offset , roundedValue + roundedValue*offset]
        })
        return slPos
      },
      changeLegend: function(layerEvt) { // layer is the leaflet WMS layer event
        console.debug(`changelegend called with`,layerEvt)

        // Find the PAIRS layer for the leaflet layer name, note that this may be a layer from the base maps
        const pairsWMSLayer=this.pairsWMSLayers[layerEvt.layer.layerName]
        if(pairsWMSLayer) {
          // setup current legend data
          this.legend={"humanUnits": getHumanUnit(layerEvt.layer.units), "name": layerEvt.layer.dataLayer, "colorMap": pairsWMSLayer.colorTable.map}

          if( this.legend.colorMap == null) {
            console.warn(`No colorMap for ${layerEvt.layer.layerName}`)
          }
          this.setShownScoringLayer(layerEvt.layer)
        }
      },
      setShownScoringLayer: function(scoringLayer) {
        this._shownScoringLayer=scoringLayer
        this._shownScoringLayer.setOpacity(this.scoringLayerOpacity/100)
      },
      humanize: function(strValue) { // for use by HTML, redirect to function defined outside
        return humanize(strValue)
      }
    }, // --- End of methods --- //

    // Available hooks: init,mounted,updated,destroyed
    init: function() {
        console.log('[indexjs:Vue.init] app init ')
    },
    mounted: function(){
        console.log('[indexjs:Vue.mounted] app mounted - setting up uibuilder watchers')

        /** **REQUIRED** Start uibuilder comms with Node-RED @since v2.0.0-dev3
         * Pass the namespace and ioPath variables if hosting page is not in the instance root folder
         * The namespace is the "url" you put in uibuilder's configuration in the Editor.
         * e.g. If you get continual `uibuilderfe:ioSetup: SOCKET CONNECT ERROR` error messages.
         * e.g. uibuilder.start('uib', '/nr/uibuilder/vendor/socket.io') // change to use your paths/names
         */
        uibuilder.start()

        // Keep track of vueApp from this scope
        var vueApp = this

        // Example of retrieving data from uibuilder
        vueApp.feVersion = uibuilder.get('version')

        // ACt on messages received from Node-RED backend
        // If msg changes - msg is updated when a standard msg is received from Node-RED over Socket.IO
        uibuilder.onChange('msg', function(msg) {
          const pairsError='pairsError' in msg

          if(pairsError) {
            // console.log(`PAIRS returned error for topic=${msg.topic}`)
            console.warn(`PAIRS returned error for topic=${msg.topic}: msg=`,msg)
          } if('pairsWarning' in msg) {
            // Warnings are not forwarded to action code, we trace only as warning when in dev mode
            if(this.isDev) {
              console.warn(`PAIRS warning  for topic=${msg.topic}: msg=`,msg)
            } else {
              // not see when not in dev mode
              console.debug(`PAIRS warning  for topic=${msg.topic}: msg=`,msg)
            }
          } else {
            switch(msg.topic) {
              case 'init':
                // ask for the list of layers
                vueApp.initLayers()
                vueApp.loadAOIs(AOIS_CATEGORY)
                vueApp.listQueryJobs()
                break;
              case 'setView':
                vueApp.setView(msg.payload.pos,msg.payload.zoom)
                break;
              case 'flyTo':
                console.log(`Fly to from nodered pos:`,payload.pos,' zoom:',msg.payload.zoom)
                flyTo(this.locationMap,msg.payload.pos,msg.payload.zoom,('duration'in msg.payload)?msg.payload.duration:null)
                break;
              case 'addLayers':
                vueApp.addlayers(this.map,msg.payload.layers,pairsError)
                break;
              case 'setRefPointMarker':
                vueApp.setRefPointMarker(msg.payload.pos)
                break;
              case 'setRectangle':
                vueApp.setRectangle(msg.payload.pos)
                break;
              case 'initLayers':
                vueApp.initializedLayers(msg.payload,pairsError)
                break;
              case 'loadAOIs':
                vueApp.loadedAOIs(msg.payload,pairsError)
                break;
              case 'loadPolygons':
                vueApp.loadedPolygons(msg.payload,pairsError)
                break;
              case 'loadLayers':
                vueApp.loadedLayers(msg.payload.data,pairsError)
                break;
              case 'scoringQuery':
                vueApp.progressScoringQuery(msg.payload,pairsError)
                break;
              case 'getResults':
                vueApp.receivedResults(msg.payload,pairsError)
                break;
              case 'scoringLayers':
                vueApp.scoredLayers(msg.payload,msg.layers,pairsError)
                break;
              case 'listQueryJobs':
                vueApp.listedQueryJobs(msg.payload,pairsError)
                break;
              case 'deleteQueryJob':
                vueApp.deletedQueryJob(msg.payload,pairsError)
                break;
              default:
                console.warn('[indexjs:uibuilder.onChange] unhandled msg received from Node-RED server:', msg)
                break;
            }
          }
        })

        // If Socket.IO connects/disconnects, we get true/false here
        uibuilder.onChange('ioConnected', connState=> vueApp.socketConnectedState = connState)
        // // If Server Time Offset changes
        // uibuilder.onChange('serverTimeOffset', function(newVal){
        //     //console.info('[indexjs:uibuilder.onChange:serverTimeOffset] Offset of time between the browser and the server has changed to:', newVal)
        //     vueApp.serverTimeOffset = newVal
        // })

        //###################### PAIRS Map stuff
        initPAIRS(L,PAIRS_HOST,PAIRS_PORT,PAIRS_WMS_AUTH)
    } // --- End of mounted hook --- //

}) // --- End of appViti --- //

/* general utility functions */
function svgDisk(w,h,ro,colo,ri=0,coli=null) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`+
         `<circle cx="50%" cy="50%" r="${ro}" fill="${colo}"/>`+
         (ri>0?`<circle cx="50%" cy="50%" r="${ri}" fill="${coli}"/>`:'')+
         "</svg>"
  console.log('Disk: ',svg)
  return svg
}

function svgCrossHair(w,h,col) {
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
        	`<circle cx="50%" cy="50%" r="35%" stroke-width="2px" stroke="${col}" fill-opacity="0"/>` +
        	`<line x1="0" y1="50%" x2="100%" y2="50%" stroke-width="2px" stroke="${col}"/>` +
        	`<line x1="50%" y1="0" x2="50%" y2="100%" stroke-width="2px" stroke="${col}"/>` +
          "</svg>"
  console.log('Crosshair: ',svg)
  return svg
}

function svgMarker(pos,size,svg,popup="Ref Point") {
  return L.marker([pos.lat,pos.lng], {icon: L.icon({iconUrl: encodeURI(`data:image/svg+xml,${svg}`).replace(/\#/g,'%23'), iconSize: size})}).bindPopup(popup)
}

/** Helper shortcut methods **/
function addRefPointMarker(pos,map) {
  // add a ref point marke on any map
  return svgMarker(pos,20,svgDisk(21,21,10,AREAS_COLOR,5,'#EF3CEA'),"Ref Point").addTo(map)
}

function flyTo(map,pos,zoom,duration) {
  map.flyTo(pos,zoom?zoom:map.getZoom(),{'animate':true,'duration':duration?duration:DEFAULT_FLYTO_SEC})
}

/* Create a leaflet latLng bounds rectangle from PAIRS coordinates specification, may be null if not found */
function boundsFromPairs(rect) {
  return (rect && rect.swLat)?[[rect.swLat,rect.swLon],[rect.neLat,rect.neLon]]:null
}
// EOF
