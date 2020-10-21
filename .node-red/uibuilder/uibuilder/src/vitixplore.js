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

// Register l-map components
console.debug("Registering Vue2Leaflet components")
Vue.component('l-map', window.Vue2Leaflet.LMap);
Vue.component('l-tilelayer', window.Vue2Leaflet.LTileLayer);
Vue.component('l-marker', window.Vue2Leaflet.LMarker);

// Vue.use()

// eslint-disable-next-line no-unused-vars
var appViti = new Vue({
    el: '#appViti',
    data: {
        curPage     : 1,
        layersDict  : null, // Dict of layers indexed by layerID
        aoisDict    : null,
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
        map         : null,
        mapCenter   : {lat : INIT_LAT, lng : INIT_LNG},
        mapZoom     : INIT_ZOOM,
        refPointMarker: null,
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
        colorMap: null,
        allColorMaps: null,
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
          dict[aoi.id]=aoi
          return dict},
          {})
          console.debug("AOISDiect",this.aoisDict)
      },
      loadLayers: function(event) {
        this.sendToNodered('loadLayers', {'pos': this.refPos, 'startDay' : this.startDay, 'endDay' : this.endDay, 'layers': Object.keys(this.layersDict)})
        this.qryRunning=true
      },
      loadedLayers: function(layers,pairsError) {
        if(!pairsError) {
          console.debug('Got layers',layers)

          // Set the Query position
          this.qryPos={"lat":layers[0].latitude, "lng":layers[0].longitude}

          // first group all the layers by layer ID and flatten Min-Mean-Max
          const _layersDict=this.layersDict
          this.qryLayers=layers.reduce(function(acc,layer) {
            if(!(layer.layerId in acc)) {
              // First time we encounter this layerID, add it to the dict
              acc[layer.layerId]={"name": layer.layerName, "id":layer.layerId, "dataset": layer.dataset}

              // append attributes from layersDict
              const LAYERS_ATTR=['description_short','description_long','datatype','units']
              LAYERS_ATTR.forEach(attribute => acc[layer.layerId][attribute]=_layersDict[layer.layerId][attribute])
            }
            // convert units
            acc[layer.layerId][layer.aggregation]=convertUnits(parseFloat(layer.value),acc[layer.layerId],'units','humanUnits')

            return acc
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
            acc[layerId]=_this.slPos(_this.qryLayers[layerId],['Lower','Upper'],offset,extent)
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
        if(mapRef==='vitiMap') {
          this.map = this.$refs[mapRef].mapObject
          this.map.on('moveend',this.mapEvent)
          this.map.on('zoomend',this.mapEvent)
          this.map.on('move',this.mapEvent)
          this.map.on('click',this.mapEvent)

          this.setView(this.mapCenter,this.mapZoom)
          this.setRefPointMarker(this.refPos)
        } else if(mapRef==='scoringMap') {
          this.scoringMap=this.$refs[mapRef].mapObject
          this.scoringMap.on('baselayerchange', this.changeLegend);

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
        console.log('event')

        console.debug('mapEvent evt:',event)
        // keep track of last center and zoom position
        this.mapCenter=this.map.getCenter()
        this.mapZoom=this.map.getZoom()
        var eventName='map'+event.type.charAt(0).toUpperCase() + event.type.slice(1)
        this.sendToNodered(eventName,{'pos':('latlng' in event)?event.latlng:this.mapCenter, 'zoom':this.mapZoom})
      },
      setRefPointMarker: function (pos) {
        if (this.refPointMarker) {
            this.map.removeLayer(this.refPointMarker);
            this.refPointMarker=null
        }
        const iconsize=26

        // let svgPin = `<svg width="${iconsize}" height="${iconsize}" xmlns="http://www.w3.org/2000/svg">`
        //             +`<circle fill="#633CEA" cx="${iconsize/2}" cy="${iconsize/2}" r="${iconsize/2-1}"/>`
        //             +`<circle fill="#B03050" cx="${iconsize/2}" cy="${iconsize/2}" r="${iconsize/4}"/>`
        //             +`</svg>`
        let svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconsize}" height="${iconsize}" viewBox="0 0 ${iconsize} ${iconsize}">`
                    //+ `<rect width="${iconsize}" height="${iconsize}" rx="${iconsize}/5" ry="10" fill="#f1d1c2"></rect>`
                    // + `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${iconsize*.7}">&#F347;</text>`
                    //+`<circle fill="#B03050" cx="${iconsize/2-1}" cy="${iconsize/2+1}" r="${iconsize/2-2}"/>`
                    + `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${iconsize/2}">🍇</text>`
                    +`</svg>`

        this.refPointMarker=L.marker([pos.lat,pos.lng], {icon: L.icon({iconUrl: encodeURI(`data:image/svg+xml,${svgPin}`).replace(/\#/g,'%23'), iconSize: iconsize})}).bindPopup("Ref Point").addTo(this.map);
        this.refPos=pos
      },
      launchScoringQuery: function () {
        // Make a dictioary with low-up-enabled values
        const _this=this
        const layers=Object.keys(this.criteriasRange)

        var scoringData=layers.map(function(layerId) {
          const humanUnits=_this.qryLayers[layerId].humanUnits
          return {'id':layerId,
                  'lower':unConvertUnits(_this.criteriasRange[layerId][0],humanUnits),
                  'upper':unConvertUnits(_this.criteriasRange[layerId][1],humanUnits),
                  'enabled':_this.criteriasCheck[layerId]}
        })

        console.log(this.criteriasRange)
        console.log(this.criteriasCheck)
        console.log(scoringData)

        // Missing aggregation
        var UDF = scoringData.reduce(function(udf,scoring) {
          if (_this.criteriasCheck[scoring.id]) {
            udf += "(( $Mean_" + scoring.id + " >= " + scoring.lower +
                    " && $Mean_" + scoring.id + " <= "+ scoring.upper + ") ? 1 : 0 ) + "
          }
          return udf
        },"")

        // remove trailing " + "
        UDF=UDF.slice(0,-3)
        console.log("UDF=",UDF)

        this.scoringInProgress=true
        this.sendToNodered('scoringQuery',{'pos':this.qryPos , 'aoi':this.refAOI, 'startDay':this.startDay,'endDay':this.endDay,'layers':scoringData,'udf':UDF})

        // this.sendToNodered('getResults', {'pos': this.qryPos, 'aoi':this.refAOI,'startDay' : this.startDay, 'endDay' : this.endDay, 'layers': layers, 'UDF': UDF})
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
      receiveResults: function(payload,pairsError) {
        if(pairsError===null) {
            console.log('PAIRS returned payload',payload)
        }

        if(payload.status==='Failed' || payload.status==='Success') {
          // query completed
          this.scoringInProgress=false
        }
      },
      scoringLayers: function(colors, dataLayers, pairsError) {
        //const layer=function newPAIRSLayer(L,geoServerURLOrId,minColor,maxColor,colorTableId,layerName,opacity)
        const _this=this
        _this.allColorMaps = colors;

        try {
          const wmsControl=dataLayers.reduce(function(control,layer) {
            const layerName=layer.name
            const newLayer=newPAIRSLayer(L,layer.geoserverUrl,layer.min,layer.max,('colorTableId' in layer)?layer.colorTableId:DEFAULT_COLORTABLEID,layerName)
            const layerDesc=layer.datalayer.split('[')[0]
            control.addBaseLayer(newLayer,layerDesc)

            // make only the scoring layer visible
            if(layerDesc=='Overall Scoring' || layerDesc=='scoring') {
              _this.scoringMap.addLayer(newLayer);
              colors.map(function(color) {
                if (color.colorTableId == layer.colorTableId) {
                  _this.colorMap = color.colorMap;
                }
              });
            }
            return control
          },L.control.layers())

          console.log("Adding overlays")
          wmsControl.addTo(this.scoringMap)

          this.flyToBounds(this.scoringMap,this.selQueryJob)
        } catch (error) {
          // console.error(error);
          // expected output: ReferenceError: nonExistentFunction is not defined
          // Note - error messages will vary depending on browser
        }
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
      slPos: function(layer, pos,offset,extent,normalize) {  // pos can be Inf, Min, Lower,  Mean, Upper, Max, Sup
        const critDigits=this.critDigits
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
            default:
              console.log(`Invalid call to slPos(${layer},${pos},${offset},${extent})`)
              return -1
            }
          }
        function _rnd(p) {
          return  Math.round(_f(p) * (10**critDigits)) / (10**critDigits)
        }

        // if it's an array, map for each element of the array
        var slPos=(Array.isArray(pos))?pos.map(_rnd):_rnd(pos)

        // if normalize has been asked, get every thing in the 0-normalize range (for the positions)
        if(normalize) {
          // We assume the elements are in order
          slPos=slPos.map(v => normalize*((v-slPos[0])/(slPos[slPos.length-1]-slPos[0])))
        }
        return slPos
      },
      changeLegend: function(layer) {
        const _this=this
        _this.colorMap = null;

        _this.allColorMaps.map(function(color) {
          if ((color.colorTableId == layer.layer.colorTableId) && (color.name == layer.layer.layerName)) {
            _this.colorMap = color.colorMap;
          }
        });
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
            console.log(`PAIRS returned error for topic=${msg.topic}`)
            // console.log(`PAIRS returned error for topic=${msg.topic}: payload=`,msg.payload)
          }
          else {
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
                vueApp.receiveResults(msg.payload,pairsError)
                break;
              case 'scoringLayers':
                vueApp.scoringLayers(msg.payload,msg.layers,pairsError)
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
