/* jshint browser: true, esversion: 5, asi: true */
/*globals Vue, uibuilder */
// @ts-nocheck
/*
  Copyright (c) 2019 Julian Knight (Totally Information)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
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

const DEFAULT_FLYTO_SEC = 2

const SIMUL_QUERYID = '1601956800_33355820'
const DEFAULT_COLORTABLEID = 4

const SCORING_LAYER_NAMES=['Overall Scoring','scoring']
const DIMENSIONS_NAMES=['depth']  // name of dimensions that are processed

// Register l-map components
console.debug("Registering Vue2Leaflet components")
Vue.component('l-map', window.Vue2Leaflet.LMap);
Vue.component('l-tilelayer', window.Vue2Leaflet.LTileLayer);
Vue.component('l-marker', window.Vue2Leaflet.LMarker);
Vue.component('l-rectangle', window.Vue2Leaflet.LRectangle);

// Vue.use()

// eslint-disable-next-line no-unused-vars
var appViti = new Vue({
    el: '#appViti',
    data: {
        curPage     : 1,
        layersDict  : null, // Dict of layers indexed by layerID
        aoisDict    : null,
        aoisArray    : [],
        test: {l:{Min:20,Mean:50,Max:100},so:0.20,sx:0.5},
        // ---- Current position and dates
        refPos      : {lat : INIT_LAT, lng : INIT_LNG},
        rectanglePos: [],
        startDay    : new Date(new Date()-1000*3600*24*30.5*MONTHS_BACK).toISOString().split("T")[0],  // About 6 months back
        endDay      : new Date().toISOString().split("T")[0],
        refAOI      : null,
        ///############## Query
        qryRunning  : false, // true while query is running
        qryPos      : null,
        qryLayers   : null,
        // ---- Map variables
        map         : null,
        mapCenter   : {lat : INIT_LAT, lng : INIT_LNG},
        mapZoom     : INIT_ZOOM,
        refPointMarker: null,
        rectanglePointMarker: null,
        rectangle: null,
        // Scoring query management
        scoringMap    : null,
        scoringInProgress : false,
        scoringStatus : null,
        scoringStart  : null,
        scoringSince  : null,
        scoringReady  : null,
        scoringBounds : null,
        scoringPercent: null,
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
        rectangleBtnIsPressed: false,
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
          Object.entries(this.aoisDict).forEach(([key, value], index) =>
            this.aoisArray[index] = value.name
          );
          this.aoisArray.sort();
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
        // console.log(this.qryLayers)

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
        this.map.flyTo(this.refPos,this.map.getZoom()+1)
      },
      onMapReady: function(mapRef) {
        console.log(`On map ready`,mapRef)
        // Tie some map events to a callback function
        if(mapRef==='vitiMap') {
          this.map = this.$refs[mapRef].mapObject
          this.map.on('moveend',this.mapEvent)
          this.map.on('zoomend',this.mapEvent)
          this.map.on('move',this.mapEvent)
          this.map.on('click',this.mapEvent)

          this.setView(this.mapCenter,this.mapZoom)
          this.setRefPointMarker(this.refPos)
        } else if(mapRef==='aoiSelMap') {
          this.aoiSelMap=this.$refs[mapRef].mapObject
          this.aoiSelMap.on('click', this.setRectangle)
        } else if(mapRef==='scoringMap') {
          this.scoringMap=this.$refs[mapRef].mapObject
          this.scoringMap.on('baselayerchange', this.changeLegend); // If we change the layer display, we call the changeLegend function

          if(this.selQueryJob!=null) {
            this.flyToBounds(this.scoringMap,this.selQueryJob)
          }
        }
        // var nitroLayer=newPAIRSLayer(L,'geoserver1',0.000000,0.0001000,4,'1588089600_03312498ESASentinel5PL2-NitrogendioxideTropospheric5042415856992000001588291200000-Mean')
        // var populLayer=newPAIRSLayer(L,'geoserver06',0,655350,92,'1588046400_35972570GlobalpopulationSEDAC-Globalpopulationdensity-01_01_2020T000000')

        var overlayMaps = {
            // "Nitro": nitroLayer,
            // "Popul": populLayer
        }
      },
      /** Helper shortcut methods **/
      flyTo: function(map,pos,zoom,duration) {
        map.flyTo(pos,zoom?zoom:this.map.getZoom(),{'animate':true,'duration':duration?duration:DEFAULT_FLYTO_SEC})
      },
      flyToBounds: function(map,queryJob,duration) {
        if(queryJob!=null && 'neLat' in queryJob) {
          const bounds=[[queryJob.neLat,queryJob.neLon],[queryJob.swLat,queryJob.swLon]]
          console.log(`Flying to bounds ${bounds}`)
          map.flyToBounds(bounds,{'animate':true,'duration':duration?duration:DEFAULT_FLYTO_SEC})
          return bounds
        } else {
          console.log('no neLat in ', queryJob)
          return null
        }
      },
      setView: function(pos,zoom) {
        this.map.setView(pos,zoom?zoom:this.map.getZoom())
      },
      addLayers: function(wmsLayers) {
        console.log('addLayers')

        console.log('Adding WMS layers from ',wmsLayers)
        wmsOverlays={}

        wmsLayers.forEach(function(layer) {

          wmsOverlays[layer.datalayer]=newPAIRSLayer(L,layer.geoserverUrl,layer.min,layer.max,layer.colorTableId,layer.name)
        })

        console.log("Adding WMS overlays ",wmsOverlays)
        L.control.layers(null, wmsOverlays).addTo(this.map);
      },
      mapEvent: function(event) {

        console.debug('mapEvent evt:',event)
        // keep tracks of last center and zoom position
        this.mapCenter=this.map.getCenter()
        this.mapZoom=this.map.getZoom()
        var eventName='map'+event.type.charAt(0).toUpperCase() + event.type.slice(1)
        this.sendToNodered(eventName,{'pos':('latlng' in event)?event.latlng:this.mapCenter, 'zoom':this.mapZoom})
      },
      setRefPointMarker: function (pos) {
        console.log(pos)
        // remove marker
        if (this.refPointMarker) {
            this.map.removeLayer(this.refPointMarker);
            this.refPointMarker=null
        }
        // add new marker
        let svgPin = '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><metadata id="metadata1">image/svg+xml</metadata><circle fill="#633CEA" cx="10" cy="10" r="9"/><circle fill="#633CEA" cx="10" cy="10" r="5"/></svg>'
        this.refPointMarker=L.marker([pos.lat,pos.lng], {icon: L.icon({iconUrl: encodeURI(`data:image/svg+xml,${svgPin}`).replace(/\#/g,'%23'), iconSize: 20})}).bindPopup("Ref Point").addTo(this.map);
        this.refPos=pos
      },
      // Function to create a rectangle on the map on page 2 - filters and regions
      setRectangle: function (pos) {
        if (this.rectangleBtnIsPressed) {
          // TO-DO : pas supposé être là j'imagine
          this.map=this.$refs['aoiSelMap'].mapObject

          // Step 1 : get first point
          if ((this.rectanglePos[0] == []) || (this.rectanglePos[0] == undefined)) {
            this.rectanglePos[0] = {"lat" : pos.latlng['lat'], "lng": pos.latlng['lng']} // save pos
            let svgPin = '<svg width="4" height="4" xmlns="http://www.w3.org/2000/svg"><metadata id="metadata1">image/svg+xml</metadata><circle fill="#633CEA" cx="2" cy="2" r="1"/></svg>'

            this.rectangleMarker=L.marker([pos.latlng['lat'], pos.latlng['lng']], {icon: L.icon({iconUrl: encodeURI(`data:image/svg+xml,${svgPin}`).replace(/\#/g,'%23'), iconSize: 20})}).bindPopup("Ref Point").addTo(this.map);  // add marker to map
          }
          // Step 2 : draw rectangle
          else if (this.rectangleMarker) {
            this.map.removeLayer(this.rectangleMarker);
            this.rectangleMarker=null // remove marker to create a rectangle

            this.rectanglePos[1] = {"lat" : pos.latlng['lat'], "lng": pos.latlng['lng']} // save pos
            this.rectangle=L.rectangle([[this.rectanglePos[0].lat, this.rectanglePos[0].lng], [this.rectanglePos[1].lat, this.rectanglePos[1].lng]], {color: "#633CEA", weight: 1}).bindPopup("Ref Point").addTo(this.map); // add rectangle to map
          }
          // Step 3 : reset
          else if ((this.rectanglePos[0] !== []) && this.rectanglePos[1] !== []) {
            this.map.removeLayer(this.rectangle);
            this.rectangle=null
            this.rectanglePos = []
          }
        }
      },
      // Triggered when we click on rectangle on page 2 - filters and regions
      chooseRectangle: function () {
        if (this.rectangleBtnIsPressed) {
          console.log("button selected")
          this.refAOI = null; // If the user chooses a rectangle selection, we remove the aoi
        } else {
          console.log("button not selected")

        }
      },
      // Triggered when we select an aoi on page 2 - filters and regions
      chooseAoi: function () {
        // If the user chooses an AOI, we remove the rectangle
        if(this.rectangleBtnIsPressed) {
          this.rectangleBtnIsPressed = false;

          // TO-DO : pas supposé être là j'imagine
          this.map=this.$refs['aoiSelMap'].mapObject

          if (this.rectangleMarker) {
            this.map.removeLayer(this.rectangleMarker);
            this.rectangleMarker=null
          } else if (this.rectanglePos[0] == undefined) {
            // added this beacause of an error in the console. Need to fix somewhere else
          } else if ((this.rectanglePos[0] !== []) && (this.rectanglePos[1] !== [])) {
            this.map.removeLayer(this.rectangle);
            this.rectangle=null
          }

          this.rectanglePos = [];
        }
      },
      launchScoringQuery: function () {
        // Make a dictionary with low-up-enabled values
        const _this=this

        const layers=Object.keys(this.criteriasCheck)
        console.log(this.criteriasCheck)

        // Create an array with values selected in sliders on page 2 - filters and regions
        var scoringData=layers.map(function(layerId) {
          if (_this.criteriasCheck[layerId]) {
            const humanUnits=_this.qryLayers[layerId].humanUnits;
            if (_this.qryLayers[layerId].dimensions_description !== undefined) {
              var data = {'id': layerId, 'enabled':_this.criteriasCheck[layerId]};
              _this.depths.map(function (depth) {
                data[depth] = {
                  'lower':fromHumanUnits(_this.criteriasRange[layerId][depth][0],humanUnits),
                  'upper':fromHumanUnits(_this.criteriasRange[layerId][depth][1],humanUnits)
                }
              })
              return data
            } else if((layerId == "50450") || (layerId == "50511" )) {
              return {
                'id':layerId,
                'type': _this.qryLayers[layerId].Mean,
                'enabled':_this.criteriasCheck[layerId]}
            } else {
              return {'id':layerId,
                'lower':fromHumanUnits(_this.criteriasRange[layerId][0],humanUnits),
                'upper':fromHumanUnits(_this.criteriasRange[layerId][1],humanUnits),
                'enabled':_this.criteriasCheck[layerId]}
            }
          }
        })

        // In the function before, we create a new array with parameter from selected layers, if layer not selected we get undefined, we want to remove them from the array
        scoringData = scoringData.filter(function (el) { return el != null; });

        var UDF = scoringData.reduce(function(udf,scoring, index) {
          if(scoring.lower) {
            udf += "(( $Mean_" + scoring.id + " >= " + scoring.lower +
                   " && $Mean_" + scoring.id + " <= "+ scoring.upper + ") ? 1 : 0 ) + "
          } else if (scoring.type) {
            udf += "(( $Mean_" + scoring.id + " == " + scoring.type + ") ? 1 : 0 ) + "
          } else {
            _this.depths.map(function (depth) {
              udf += "(( $" + depth + "_" + scoring.id + " >= " + scoring[depth].lower +
                     " && $" + depth + "_" + scoring.id + " <= "+ scoring[depth].upper + ") ? 1 : 0 ) + "
            })
          }
          return udf
        },"")

        // remove trailing " + "
        UDF=UDF.slice(0,-3)
        // UDF+= ")*100)/" + scoringData.length + ")";

        if (this.rectangle) { this.formatCoordinates() }

        this.scoringInProgress=true

        this.sendToNodered('scoringQuery', {'pos': this.qryPos , 'aoi': this.aoisDict[this.refAOI], 'startDay':this.startDay,'endDay':this.endDay,'layers':scoringData,'udf':UDF, 'layerInfo': this.qryLayers})

        this.pairsWMSLayers=null
        this.legend=null
        this.curPage=3
      },
      progressScoringQuery: function(progress,pairsError) {
        console.debug("progressScoringQuery",progress,pairsError)
        this.scoringStatus=progress.status
        this.scoringStart=progress.start
        this.scoringSince=Date.now()-progress.start
        this.scoringReady=progress.ready
        this.scoringPercent=progress.exPercent

        const newBounds=[[progress.neLat,progress.neLon],[progress.swLat,progress.swLon]]
        // If this is a query not ready yet, animate the map now, otherwise it will be animated later
        if(newBounds!=this.scoringBounds && !progress.ready) {
          // do a long flyover
          this.flyToBounds(this.scoringMap,progress,3)
        }
        this.scoringBounds=newBounds

        if(['Initializing','Queued','Running','Writing'].includes(progress.status)) {
          // still running
        } else {
          if(progress.status==='Succeeded') {
            // Now get the WMS layers and add them to map
            this.sendToNodered('scoringLayers',progress.id)
          } else if(progress.status==='Failed' || progress.status==="FailedConversion") {
            console.log("Failed Query Job")
          } else {
            // unknown status
            console.log("Unknown QueryJob Status",progress.status)
          }
          this.scoringInProgress=false
        }
      },
      deletedQuery: function(payload,pairsError) {
        // Reload the Queries list
      },
      receivedResults: function(payload,pairsError) {
        if(pairsError===null) {
            console.log('PAIRS returned payload',payload)
        }

        if(payload.status==='Failed' || payload.status==='Success') {
          // query completed
          this.scoringInProgress=false
        }
      },
      scoredLayers: function(colorMaps, pairsWMSLayers, pairsError) {
        //const layer=function newPAIRSLayer(L,geoServerURLOrId,minColor,maxColor,colorTableId,layerName,opacity)
        this.pairsWMSLayers = {}  // The WMS datalayers from PAIRS

        // Create a Layers Control to add to the Map
        const layersControl=L.control.layers()

        // The colorMaps and dataLayers have the same indexing, add the colorMap to the layer
        for(var i=0;i<pairsWMSLayers.length;i++) {
          const pairsWMSLayer=pairsWMSLayers[i]
          const layerName=pairsWMSLayer.name

          // Store the layer in a dict indexed by full layerName
          this.pairsWMSLayers[layerName]=pairsWMSLayer

          const layerId=pairsWMSLayer.datalayerId

          // Find out which unit is used
          const unit = (this.layersDict && layerId !== undefined)? this.layersDict[layerId].units : "%"

          // get color for legend from colorMap at same index
          const colorTableId=colorMaps[i].colorTableId
          const colorMap=(colorMaps.length!=pairsWMSLayers.length)?null:
            colorMaps[i].colorMap.map(function(colorEntry) {
              colorEntry.$.label=toHumanUnit(colorEntry.$.label,unit)
              return colorEntry.$
            })

          pairsWMSLayer["colorTable"]={"id":colorTableId,"map":colorMap}
          if(!colorMap) {
            console.warn(`Cannot map layers to colorTables ${pairsWMSLayers.length}<>${colorMaps.length}`)
          }

          var layerDesc=pairsWMSLayer.datalayer.split('[')[0]

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

          // Add the leaflet PAIRS layer to the layers control
          layersControl.addBaseLayer(newLayer,layerDesc)

          // Find the Scoring layer and add it to the map to make it visible, and setup legend
          // make the scoring layer visible
          if(SCORING_LAYER_NAMES.includes(layerDesc)) {
            // add to the map makes the layer visible
            this.scoringMap.addLayer(newLayer);

            // setup current legend data
            this.legend={"humanUnits": getHumanUnit(unit), "name": layerDesc, "colorMap": colorMap}
          }
        }

        // Finally, add the Layers Control to the map
        console.log(`Adding layers control to map`)
        layersControl.addTo(this.scoringMap)

        // Fly to the layer
        this.flyToBounds(this.scoringMap,this.selQueryJob)
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
        this.scoringInProgress=true
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
      formatCoordinates: function () {
        // square pos to send to PAIRS = [southernmost latitude, westernmost longitude, northernmost latitude, easternmost longitude]
        if (this.rectanglePos[0].lat > this.rectanglePos[1].lat) {
          this.qryPos["rSouth"] = this.rectanglePos[1].lat;
          this.qryPos["rNorth"] = this.rectanglePos[0].lat;
        } else {
          this.qryPos["rSouth"] = this.rectanglePos[0].lat;
          this.qryPos["rNorth"] = this.rectanglePos[1].lat;
        }

        if (this.rectanglePos[0].lng > this.rectanglePos[1].lng) {
          this.qryPos["rWest"] = this.rectanglePos[1].lng;
          this.qryPos["rEast"] = this.rectanglePos[0].lng;
        } else {
          this.qryPos["rWest"] = this.rectanglePos[0].lng;
          this.qryPos["rEast"] = this.rectanglePos[1].lng;
        }
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
              console.log(`Invalid call to slPos(${layer},${pos},${offset},${extent})`)
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
        console.log(`changelegend called with`,layerEvt)

        // Find the PAIRS layer for the leaflet layer name
        const pairsWMSLayer=this.pairsWMSLayers[layerEvt.layer.layerName]

        // setup current legend data
        this.legend={"humanUnits": getHumanUnit(layerEvt.layer.units), "name": layerEvt.layer.dataLayer, "colorMap": pairsWMSLayer.colorTable.map}

        if( this.legend.colorMap == null) {
          console.log(`No colorMap for ${layerEvt.layer.layerName}`)
        }
      },
      humanize: function(strValue) {
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
            console.log(`PAIRS returned error for topic=${msg.topic}: msg=`,msg)
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
                vueApp.flyTo(this.map,msg.payload.pos,msg.payload.zoom,('duration'in msg.payload)?msg.payload.duration:null)
                break;
              case 'addLayers':
                vueApp.addlayers(msg.payload.layers,pairsError)
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
                console.log('[indexjs:uibuilder.onChange] unhandled msg received from Node-RED server:', msg)
                break;
            }
          }
        })

        // If Socket.IO connects/disconnects, we get true/false here
        uibuilder.onChange('ioConnected', function(connState) {
            //console.info('[indexjs:uibuilder.onChange:ioConnected] Socket.IO Connection Status Changed to:', newVal)
            vueApp.socketConnectedState = connState
        })
        // // If Server Time Offset changes
        // uibuilder.onChange('serverTimeOffset', function(newVal){
        //     //console.info('[indexjs:uibuilder.onChange:serverTimeOffset] Offset of time between the browser and the server has changed to:', newVal)
        //     vueApp.serverTimeOffset = newVal
        // })

        //###################### PAIRS Map stuff
        initPAIRS(L,PAIRS_HOST,PAIRS_PORT,PAIRS_WMS_AUTH)
    } // --- End of mounted hook --- //

}) // --- End of appViti --- //

// EOF
