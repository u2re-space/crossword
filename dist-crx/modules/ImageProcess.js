let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let cachedUint8ClampedMemory0 = null;

function getUint8ClampedMemory0() {
    if (cachedUint8ClampedMemory0 === null || cachedUint8ClampedMemory0.byteLength === 0) {
        cachedUint8ClampedMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
    }
    return cachedUint8ClampedMemory0;
}

function getClampedArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ClampedMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
* @param {Uint8Array} data
* @param {number} width
* @param {number} height
* @param {number} bit_depth
* @returns {Uint8Array}
*/
function encode$2(data, width, height, bit_depth) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.encode(retptr, ptr0, len0, width, height, bit_depth);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* @param {Uint8Array} data
* @returns {ImageData}
*/
function decode$2(data) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decode(ptr0, len0);
    return takeObject(ret);
}

/**
* @param {Uint8Array} data
* @returns {ImageDataRGBA16}
*/
function decode_rgba16(data) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decode_rgba16(ptr0, len0);
    return ImageDataRGBA16.__wrap(ret);
}

/**
*/
class ImageDataRGBA16 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ImageDataRGBA16.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_imagedatargba16_free(ptr);
    }
    /**
    * @returns {number}
    */
    get width() {
        const ret = wasm.imagedatargba16_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    get height() {
        const ret = wasm.imagedatargba16_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @returns {Uint16Array}
    */
    get data() {
        const ret = wasm.imagedatargba16_data(this.__wbg_ptr);
        return takeObject(ret);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_a448f833075b71ba = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_099217381c451830 = function(arg0, arg1, arg2) {
        const ret = new Uint16Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_newwithownedu8clampedarrayandsh_91db5987993a08fb = function(arg0, arg1, arg2, arg3) {
        var v0 = getClampedArrayU8FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1, 1);
        const ret = new ImageData(v0, arg2 >>> 0, arg3 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, maybe_memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedInt32Memory0 = null;
    cachedUint8Memory0 = null;
    cachedUint8ClampedMemory0 = null;


    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;

    if (typeof input === 'undefined') {
        input = new URL(""+new URL('../assets/squoosh_png_bg.wasm', import.meta.url).href+"", import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}
const isServiceWorker = globalThis.ServiceWorkerGlobalScope !== undefined;
const isRunningInCloudFlareWorkers = isServiceWorker && typeof self !== 'undefined' && globalThis.caches && globalThis.caches.default !== undefined;
const isRunningInNode = typeof process === 'object' && process.release && process.release.name === 'node';

if (isRunningInCloudFlareWorkers || isRunningInNode) {
  if (!globalThis.ImageData) {
    // Simple Polyfill for ImageData Object
    globalThis.ImageData = class ImageData {
      constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }

  if (import.meta.url === undefined) {
    import.meta.url = 'https://localhost';
  }

  if (typeof self !== 'undefined' && self.location === undefined) {
    self.location = { href: '' };
  }
}

/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let pngModule$1;
async function init$3(moduleOrPath) {
    if (!pngModule$1) {
        pngModule$1 = __wbg_init(moduleOrPath);
    }
    return pngModule$1;
}
async function encode$1(data, options = {}) {
    var _a;
    await init$3();
    const bitDepth = (_a = options === null || options === void 0 ? void 0 : options.bitDepth) !== null && _a !== void 0 ? _a : 8;
    if (bitDepth !== 8 && bitDepth !== 16) {
        throw new Error('Invalid bit depth. Must be either 8 or 16.');
    }
    const isUint16Array = data.data instanceof Uint16Array;
    if (isUint16Array && bitDepth !== 16) {
        throw new Error('Invalid bit depth, must be 16 for Uint16Array or manually convert to RGB8 values with Uint8Array.');
    }
    if (!isUint16Array && bitDepth === 16) {
        throw new Error('Invalid bit depth, must be 8 for Uint8Array or manually convert to RGB16 values with Uint16Array.');
    }
    const encodeData = new Uint8Array(data.data.buffer);
    const output = await encode$2(encodeData, data.width, data.height, bitDepth);
    if (!output)
        throw new Error('Encoding error.');
    return output.buffer;
}

/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let pngModule;
async function init$2(moduleOrPath) {
    if (!pngModule) {
        pngModule = __wbg_init(moduleOrPath);
    }
    return pngModule;
}
async function decode$1(data, options = {}) {
    await init$2();
    const { bitDepth = 8 } = options;
    if (bitDepth === 16) {
        const imageData = await decode_rgba16(new Uint8Array(data));
        if (!imageData)
            throw new Error('Encoding error.');
        return imageData;
    }
    const imageData = await decode$2(new Uint8Array(data));
    if (!imageData)
        throw new Error('Encoding error.');
    return imageData;
}

var Module$1 = (() => {
  var _scriptDir = import.meta.url;
  
  return (
function(moduleArg = {}) {

var Module=moduleArg;var readyPromiseResolve,readyPromiseReject;var readyPromise=new Promise((resolve,reject)=>{readyPromiseResolve=resolve;readyPromiseReject=reject;});const isServiceWorker=globalThis.ServiceWorkerGlobalScope!==undefined;const isRunningInCloudFlareWorkers=isServiceWorker&&typeof self!=="undefined"&&globalThis.caches&&globalThis.caches.default!==undefined;const isRunningInNode=typeof process==="object"&&process.release&&process.release.name==="node";if(isRunningInCloudFlareWorkers||isRunningInNode){if(!globalThis.ImageData){globalThis.ImageData=class ImageData{constructor(data,width,height){this.data=data;this.width=width;this.height=height;}};}if(import.meta.url===undefined){import.meta.url="https://localhost";}if(typeof self!=="undefined"&&self.location===undefined){self.location={href:""};}}var moduleOverrides=Object.assign({},Module);var arguments_=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};var ENVIRONMENT_IS_WEB=typeof window=="object";var ENVIRONMENT_IS_WORKER=typeof importScripts=="function";var ENVIRONMENT_IS_NODE=typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string";var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href;}else if(typeof document!="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src;}if(_scriptDir){scriptDirectory=_scriptDir;}if(scriptDirectory.startsWith("blob:")){scriptDirectory="";}else {scriptDirectory=scriptDirectory.substr(0,scriptDirectory.replace(/[?#].*/,"").lastIndexOf("/")+1);}{read_=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)};}readAsync=(url,onload,onerror)=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=()=>{if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror();};xhr.onerror=onerror;xhr.send(null);};}}else {}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.error.bind(console);Object.assign(Module,moduleOverrides);moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var wasmMemory;var ABORT=false;var EXITSTATUS;var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateMemoryViews(){var b=wasmMemory.buffer;Module["HEAP8"]=HEAP8=new Int8Array(b);Module["HEAP16"]=HEAP16=new Int16Array(b);Module["HEAPU8"]=HEAPU8=new Uint8Array(b);Module["HEAPU16"]=HEAPU16=new Uint16Array(b);Module["HEAP32"]=HEAP32=new Int32Array(b);Module["HEAPU32"]=HEAPU32=new Uint32Array(b);Module["HEAPF32"]=HEAPF32=new Float32Array(b);Module["HEAPF64"]=HEAPF64=new Float64Array(b);}var __ATPRERUN__=[];var __ATINIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__);}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}function addOnInit(cb){__ATINIT__.unshift(cb);}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;Module["monitorRunDependencies"]?.(runDependencies);}function removeRunDependency(id){runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null;}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}}}function abort(what){Module["onAbort"]?.(what);what="Aborted("+what+")";err(what);ABORT=true;EXITSTATUS=1;what+=". Build with -sASSERTIONS for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e}var dataURIPrefix="data:application/octet-stream;base64,";var isDataURI=filename=>filename.startsWith(dataURIPrefix);var wasmBinaryFile;if(Module["locateFile"]){wasmBinaryFile="mozjpeg_enc.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile);}}else {wasmBinaryFile=new URL(""+new URL('../assets/mozjpeg_enc.wasm', import.meta.url).href+"", import.meta.url).href;}function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}throw "both async and sync fetching of the wasm failed"}function getBinaryPromise(binaryFile){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch=="function"){return fetch(binaryFile,{credentials:"same-origin"}).then(response=>{if(!response["ok"]){throw `failed to load wasm binary file at '${binaryFile}'`}return response["arrayBuffer"]()}).catch(()=>getBinarySync(binaryFile))}}return Promise.resolve().then(()=>getBinarySync(binaryFile))}function instantiateArrayBuffer(binaryFile,imports,receiver){return getBinaryPromise(binaryFile).then(binary=>WebAssembly.instantiate(binary,imports)).then(receiver,reason=>{err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason);})}function instantiateAsync(binary,binaryFile,imports,callback){if(!binary&&typeof WebAssembly.instantiateStreaming=="function"&&!isDataURI(binaryFile)&&typeof fetch=="function"){return fetch(binaryFile,{credentials:"same-origin"}).then(response=>{var result=WebAssembly.instantiateStreaming(response,imports);return result.then(callback,function(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(binaryFile,imports,callback)})})}return instantiateArrayBuffer(binaryFile,imports,callback)}function createWasm(){var info={"a":wasmImports};function receiveInstance(instance,module){wasmExports=instance.exports;wasmMemory=wasmExports["C"];updateMemoryViews();wasmTable=wasmExports["H"];addOnInit(wasmExports["D"]);removeRunDependency("wasm-instantiate");return wasmExports}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){receiveInstance(result["instance"]);}if(Module["instantiateWasm"]){try{return Module["instantiateWasm"](info,receiveInstance)}catch(e){err(`Module.instantiateWasm callback failed with error: ${e}`);readyPromiseReject(e);}}instantiateAsync(wasmBinary,wasmBinaryFile,info,receiveInstantiationResult).catch(readyPromiseReject);return {}}function ExitStatus(status){this.name="ExitStatus";this.message=`Program terminated with exit(${status})`;this.status=status;}var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module);}};var noExitRuntime=Module["noExitRuntime"]||true;class ExceptionInfo{constructor(excPtr){this.excPtr=excPtr;this.ptr=excPtr-24;}set_type(type){HEAPU32[this.ptr+4>>2]=type;}get_type(){return HEAPU32[this.ptr+4>>2]}set_destructor(destructor){HEAPU32[this.ptr+8>>2]=destructor;}get_destructor(){return HEAPU32[this.ptr+8>>2]}set_caught(caught){caught=caught?1:0;HEAP8[this.ptr+12]=caught;}get_caught(){return HEAP8[this.ptr+12]!=0}set_rethrown(rethrown){rethrown=rethrown?1:0;HEAP8[this.ptr+13]=rethrown;}get_rethrown(){return HEAP8[this.ptr+13]!=0}init(type,destructor){this.set_adjusted_ptr(0);this.set_type(type);this.set_destructor(destructor);}set_adjusted_ptr(adjustedPtr){HEAPU32[this.ptr+16>>2]=adjustedPtr;}get_adjusted_ptr(){return HEAPU32[this.ptr+16>>2]}get_exception_ptr(){var isPointer=___cxa_is_pointer_type(this.get_type());if(isPointer){return HEAPU32[this.excPtr>>2]}var adjusted=this.get_adjusted_ptr();if(adjusted!==0)return adjusted;return this.excPtr}}var exceptionLast=0;var uncaughtExceptionCount=0;var ___cxa_throw=(ptr,type,destructor)=>{var info=new ExceptionInfo(ptr);info.init(type,destructor);exceptionLast=ptr;uncaughtExceptionCount++;throw exceptionLast};var structRegistrations={};var runDestructors=destructors=>{while(destructors.length){var ptr=destructors.pop();var del=destructors.pop();del(ptr);}};function readPointer(pointer){return this["fromWireType"](HEAPU32[pointer>>2])}var awaitingDependencies={};var registeredTypes={};var typeDependencies={};var InternalError;var throwInternalError=message=>{throw new InternalError(message)};var whenDependentTypesAreResolved=(myTypes,dependentTypes,getTypeConverters)=>{myTypes.forEach(function(type){typeDependencies[type]=dependentTypes;});function onComplete(typeConverters){var myTypeConverters=getTypeConverters(typeConverters);if(myTypeConverters.length!==myTypes.length){throwInternalError("Mismatched type converter count");}for(var i=0;i<myTypes.length;++i){registerType(myTypes[i],myTypeConverters[i]);}}var typeConverters=new Array(dependentTypes.length);var unregisteredTypes=[];var registered=0;dependentTypes.forEach((dt,i)=>{if(registeredTypes.hasOwnProperty(dt)){typeConverters[i]=registeredTypes[dt];}else {unregisteredTypes.push(dt);if(!awaitingDependencies.hasOwnProperty(dt)){awaitingDependencies[dt]=[];}awaitingDependencies[dt].push(()=>{typeConverters[i]=registeredTypes[dt];++registered;if(registered===unregisteredTypes.length){onComplete(typeConverters);}});}});if(0===unregisteredTypes.length){onComplete(typeConverters);}};var __embind_finalize_value_object=structType=>{var reg=structRegistrations[structType];delete structRegistrations[structType];var rawConstructor=reg.rawConstructor;var rawDestructor=reg.rawDestructor;var fieldRecords=reg.fields;var fieldTypes=fieldRecords.map(field=>field.getterReturnType).concat(fieldRecords.map(field=>field.setterArgumentType));whenDependentTypesAreResolved([structType],fieldTypes,fieldTypes=>{var fields={};fieldRecords.forEach((field,i)=>{var fieldName=field.fieldName;var getterReturnType=fieldTypes[i];var getter=field.getter;var getterContext=field.getterContext;var setterArgumentType=fieldTypes[i+fieldRecords.length];var setter=field.setter;var setterContext=field.setterContext;fields[fieldName]={read:ptr=>getterReturnType["fromWireType"](getter(getterContext,ptr)),write:(ptr,o)=>{var destructors=[];setter(setterContext,ptr,setterArgumentType["toWireType"](destructors,o));runDestructors(destructors);}};});return [{name:reg.name,"fromWireType":ptr=>{var rv={};for(var i in fields){rv[i]=fields[i].read(ptr);}rawDestructor(ptr);return rv},"toWireType":(destructors,o)=>{for(var fieldName in fields){if(!(fieldName in o)){throw new TypeError(`Missing field: "${fieldName}"`)}}var ptr=rawConstructor();for(fieldName in fields){fields[fieldName].write(ptr,o[fieldName]);}if(destructors!==null){destructors.push(rawDestructor,ptr);}return ptr},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction:rawDestructor}]});};var __embind_register_bigint=(primitiveType,name,size,minRange,maxRange)=>{};var embind_init_charCodes=()=>{var codes=new Array(256);for(var i=0;i<256;++i){codes[i]=String.fromCharCode(i);}embind_charCodes=codes;};var embind_charCodes;var readLatin1String=ptr=>{var ret="";var c=ptr;while(HEAPU8[c]){ret+=embind_charCodes[HEAPU8[c++]];}return ret};var BindingError;var throwBindingError=message=>{throw new BindingError(message)};function sharedRegisterType(rawType,registeredInstance,options={}){var name=registeredInstance.name;if(!rawType){throwBindingError(`type "${name}" must have a positive integer typeid pointer`);}if(registeredTypes.hasOwnProperty(rawType)){if(options.ignoreDuplicateRegistrations){return}else {throwBindingError(`Cannot register type '${name}' twice`);}}registeredTypes[rawType]=registeredInstance;delete typeDependencies[rawType];if(awaitingDependencies.hasOwnProperty(rawType)){var callbacks=awaitingDependencies[rawType];delete awaitingDependencies[rawType];callbacks.forEach(cb=>cb());}}function registerType(rawType,registeredInstance,options={}){if(!("argPackAdvance"in registeredInstance)){throw new TypeError("registerType registeredInstance requires argPackAdvance")}return sharedRegisterType(rawType,registeredInstance,options)}var GenericWireTypeSize=8;var __embind_register_bool=(rawType,name,trueValue,falseValue)=>{name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":function(wt){return !!wt},"toWireType":function(destructors,o){return o?trueValue:falseValue},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":function(pointer){return this["fromWireType"](HEAPU8[pointer])},destructorFunction:null});};var emval_freelist=[];var emval_handles=[];var __emval_decref=handle=>{if(handle>9&&0===--emval_handles[handle+1]){emval_handles[handle]=undefined;emval_freelist.push(handle);}};var count_emval_handles=()=>emval_handles.length/2-5-emval_freelist.length;var init_emval=()=>{emval_handles.push(0,1,undefined,1,null,1,true,1,false,1);Module["count_emval_handles"]=count_emval_handles;};var Emval={toValue:handle=>{if(!handle){throwBindingError("Cannot use deleted val. handle = "+handle);}return emval_handles[handle]},toHandle:value=>{switch(value){case undefined:return 2;case null:return 4;case true:return 6;case false:return 8;default:{const handle=emval_freelist.pop()||emval_handles.length;emval_handles[handle]=value;emval_handles[handle+1]=1;return handle}}}};var EmValType={name:"emscripten::val","fromWireType":handle=>{var rv=Emval.toValue(handle);__emval_decref(handle);return rv},"toWireType":(destructors,value)=>Emval.toHandle(value),"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction:null};var __embind_register_emval=rawType=>registerType(rawType,EmValType);var floatReadValueFromPointer=(name,width)=>{switch(width){case 4:return function(pointer){return this["fromWireType"](HEAPF32[pointer>>2])};case 8:return function(pointer){return this["fromWireType"](HEAPF64[pointer>>3])};default:throw new TypeError(`invalid float width (${width}): ${name}`)}};var __embind_register_float=(rawType,name,size)=>{name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":value=>value,"toWireType":(destructors,value)=>value,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":floatReadValueFromPointer(name,size),destructorFunction:null});};var createNamedFunction=(name,body)=>Object.defineProperty(body,"name",{value:name});function usesDestructorStack(argTypes){for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){return true}}return false}function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=usesDestructorStack(argTypes);var returns=argTypes[0].name!=="void";var expectedArgCount=argCount-2;var argsWired=new Array(expectedArgCount);var invokerFuncArgs=[];var destructors=[];var invokerFn=function(...args){if(args.length!==expectedArgCount){throwBindingError(`function ${humanName} called with ${args.length} arguments, expected ${expectedArgCount}`);}destructors.length=0;var thisWired;invokerFuncArgs.length=isClassMethodFunc?2:1;invokerFuncArgs[0]=cppTargetFunc;if(isClassMethodFunc){thisWired=argTypes[1]["toWireType"](destructors,this);invokerFuncArgs[1]=thisWired;}for(var i=0;i<expectedArgCount;++i){argsWired[i]=argTypes[i+2]["toWireType"](destructors,args[i]);invokerFuncArgs.push(argsWired[i]);}var rv=cppInvokerFunc(...invokerFuncArgs);function onDone(rv){if(needsDestructorStack){runDestructors(destructors);}else {for(var i=isClassMethodFunc?1:2;i<argTypes.length;i++){var param=i===1?thisWired:argsWired[i-2];if(argTypes[i].destructorFunction!==null){argTypes[i].destructorFunction(param);}}}if(returns){return argTypes[0]["fromWireType"](rv)}}return onDone(rv)};return createNamedFunction(humanName,invokerFn)}var ensureOverloadTable=(proto,methodName,humanName)=>{if(undefined===proto[methodName].overloadTable){var prevFunc=proto[methodName];proto[methodName]=function(...args){if(!proto[methodName].overloadTable.hasOwnProperty(args.length)){throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);}return proto[methodName].overloadTable[args.length].apply(this,args)};proto[methodName].overloadTable=[];proto[methodName].overloadTable[prevFunc.argCount]=prevFunc;}};var exposePublicSymbol=(name,value,numArguments)=>{if(Module.hasOwnProperty(name)){if(undefined===numArguments||undefined!==Module[name].overloadTable&&undefined!==Module[name].overloadTable[numArguments]){throwBindingError(`Cannot register public name '${name}' twice`);}ensureOverloadTable(Module,name,name);if(Module.hasOwnProperty(numArguments)){throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);}Module[name].overloadTable[numArguments]=value;}else {Module[name]=value;if(undefined!==numArguments){Module[name].numArguments=numArguments;}}};var heap32VectorToArray=(count,firstElement)=>{var array=[];for(var i=0;i<count;i++){array.push(HEAPU32[firstElement+i*4>>2]);}return array};var replacePublicSymbol=(name,value,numArguments)=>{if(!Module.hasOwnProperty(name)){throwInternalError("Replacing nonexistent public symbol");}if(undefined!==Module[name].overloadTable&&undefined!==numArguments){Module[name].overloadTable[numArguments]=value;}else {Module[name]=value;Module[name].argCount=numArguments;}};var dynCallLegacy=(sig,ptr,args)=>{sig=sig.replace(/p/g,"i");var f=Module["dynCall_"+sig];return f(ptr,...args)};var wasmTableMirror=[];var wasmTable;var getWasmTableEntry=funcPtr=>{var func=wasmTableMirror[funcPtr];if(!func){if(funcPtr>=wasmTableMirror.length)wasmTableMirror.length=funcPtr+1;wasmTableMirror[funcPtr]=func=wasmTable.get(funcPtr);}return func};var dynCall=(sig,ptr,args=[])=>{if(sig.includes("j")){return dynCallLegacy(sig,ptr,args)}var rtn=getWasmTableEntry(ptr)(...args);return rtn};var getDynCaller=(sig,ptr)=>(...args)=>dynCall(sig,ptr,args);var embind__requireFunction=(signature,rawFunction)=>{signature=readLatin1String(signature);function makeDynCaller(){if(signature.includes("j")){return getDynCaller(signature,rawFunction)}return getWasmTableEntry(rawFunction)}var fp=makeDynCaller();if(typeof fp!="function"){throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);}return fp};var extendError=(baseErrorType,errorName)=>{var errorClass=createNamedFunction(errorName,function(message){this.name=errorName;this.message=message;var stack=new Error(message).stack;if(stack!==undefined){this.stack=this.toString()+"\n"+stack.replace(/^Error(:[^\n]*)?\n/,"");}});errorClass.prototype=Object.create(baseErrorType.prototype);errorClass.prototype.constructor=errorClass;errorClass.prototype.toString=function(){if(this.message===undefined){return this.name}else {return `${this.name}: ${this.message}`}};return errorClass};var UnboundTypeError;var getTypeName=type=>{var ptr=___getTypeName(type);var rv=readLatin1String(ptr);_free(ptr);return rv};var throwUnboundTypeError=(message,types)=>{var unboundTypes=[];var seen={};function visit(type){if(seen[type]){return}if(registeredTypes[type]){return}if(typeDependencies[type]){typeDependencies[type].forEach(visit);return}unboundTypes.push(type);seen[type]=true;}types.forEach(visit);throw new UnboundTypeError(`${message}: `+unboundTypes.map(getTypeName).join([", "]))};var getFunctionName=signature=>{signature=signature.trim();const argsIndex=signature.indexOf("(");if(argsIndex!==-1){return signature.substr(0,argsIndex)}else {return signature}};var __embind_register_function=(name,argCount,rawArgTypesAddr,signature,rawInvoker,fn,isAsync)=>{var argTypes=heap32VectorToArray(argCount,rawArgTypesAddr);name=readLatin1String(name);name=getFunctionName(name);rawInvoker=embind__requireFunction(signature,rawInvoker);exposePublicSymbol(name,function(){throwUnboundTypeError(`Cannot call ${name} due to unbound types`,argTypes);},argCount-1);whenDependentTypesAreResolved([],argTypes,argTypes=>{var invokerArgsArray=[argTypes[0],null].concat(argTypes.slice(1));replacePublicSymbol(name,craftInvokerFunction(name,invokerArgsArray,null,rawInvoker,fn,isAsync),argCount-1);return []});};var integerReadValueFromPointer=(name,width,signed)=>{switch(width){case 1:return signed?pointer=>HEAP8[pointer]:pointer=>HEAPU8[pointer];case 2:return signed?pointer=>HEAP16[pointer>>1]:pointer=>HEAPU16[pointer>>1];case 4:return signed?pointer=>HEAP32[pointer>>2]:pointer=>HEAPU32[pointer>>2];default:throw new TypeError(`invalid integer width (${width}): ${name}`)}};var __embind_register_integer=(primitiveType,name,size,minRange,maxRange)=>{name=readLatin1String(name);if(maxRange===-1){maxRange=4294967295;}var fromWireType=value=>value;if(minRange===0){var bitshift=32-8*size;fromWireType=value=>value<<bitshift>>>bitshift;}var isUnsignedType=name.includes("unsigned");var checkAssertions=(value,toTypeName)=>{};var toWireType;if(isUnsignedType){toWireType=function(destructors,value){checkAssertions(value,this.name);return value>>>0};}else {toWireType=function(destructors,value){checkAssertions(value,this.name);return value};}registerType(primitiveType,{name:name,"fromWireType":fromWireType,"toWireType":toWireType,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":integerReadValueFromPointer(name,size,minRange!==0),destructorFunction:null});};var __embind_register_memory_view=(rawType,dataTypeIndex,name)=>{var typeMapping=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array];var TA=typeMapping[dataTypeIndex];function decodeMemoryView(handle){var size=HEAPU32[handle>>2];var data=HEAPU32[handle+4>>2];return new TA(HEAP8.buffer,data,size)}name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":decodeMemoryView,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":decodeMemoryView},{ignoreDuplicateRegistrations:true});};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023;}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u;}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63;}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}else {if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}}heap[outIdx]=0;return outIdx-startIdx};var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite);var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++;}else if(c<=2047){len+=2;}else if(c>=55296&&c<=57343){len+=4;++i;}else {len+=3;}}return len};var UTF8ArrayToString=(heapOrArray,idx,maxBytesToRead)=>{var endIdx=idx+maxBytesToRead;var str="";while(!(idx>=endIdx)){var u0=heapOrArray[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2;}else {u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63;}if(u0<65536){str+=String.fromCharCode(u0);}else {var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}}return str};var UTF8ToString=(ptr,maxBytesToRead)=>ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):"";var __embind_register_std_string=(rawType,name)=>{name=readLatin1String(name);var stdStringIsUTF8=name==="std::string";registerType(rawType,{name:name,"fromWireType"(value){var length=HEAPU32[value>>2];var payload=value+4;var str;if(stdStringIsUTF8){var decodeStartPtr=payload;for(var i=0;i<=length;++i){var currentBytePtr=payload+i;if(i==length||HEAPU8[currentBytePtr]==0){var maxRead=currentBytePtr-decodeStartPtr;var stringSegment=UTF8ToString(decodeStartPtr,maxRead);if(str===undefined){str=stringSegment;}else {str+=String.fromCharCode(0);str+=stringSegment;}decodeStartPtr=currentBytePtr+1;}}}else {var a=new Array(length);for(var i=0;i<length;++i){a[i]=String.fromCharCode(HEAPU8[payload+i]);}str=a.join("");}_free(value);return str},"toWireType"(destructors,value){if(value instanceof ArrayBuffer){value=new Uint8Array(value);}var length;var valueIsOfTypeString=typeof value=="string";if(!(valueIsOfTypeString||value instanceof Uint8Array||value instanceof Uint8ClampedArray||value instanceof Int8Array)){throwBindingError("Cannot pass non-string to std::string");}if(stdStringIsUTF8&&valueIsOfTypeString){length=lengthBytesUTF8(value);}else {length=value.length;}var base=_malloc(4+length+1);var ptr=base+4;HEAPU32[base>>2]=length;if(stdStringIsUTF8&&valueIsOfTypeString){stringToUTF8(value,ptr,length+1);}else {if(valueIsOfTypeString){for(var i=0;i<length;++i){var charCode=value.charCodeAt(i);if(charCode>255){_free(ptr);throwBindingError("String has UTF-16 code units that do not fit in 8 bits");}HEAPU8[ptr+i]=charCode;}}else {for(var i=0;i<length;++i){HEAPU8[ptr+i]=value[i];}}}if(destructors!==null){destructors.push(_free,base);}return base},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction(ptr){_free(ptr);}});};var UTF16ToString=(ptr,maxBytesToRead)=>{var str="";for(var i=0;!(i>=maxBytesToRead/2);++i){var codeUnit=HEAP16[ptr+i*2>>1];if(codeUnit==0)break;str+=String.fromCharCode(codeUnit);}return str};var stringToUTF16=(str,outPtr,maxBytesToWrite)=>{maxBytesToWrite??=2147483647;if(maxBytesToWrite<2)return 0;maxBytesToWrite-=2;var startPtr=outPtr;var numCharsToWrite=maxBytesToWrite<str.length*2?maxBytesToWrite/2:str.length;for(var i=0;i<numCharsToWrite;++i){var codeUnit=str.charCodeAt(i);HEAP16[outPtr>>1]=codeUnit;outPtr+=2;}HEAP16[outPtr>>1]=0;return outPtr-startPtr};var lengthBytesUTF16=str=>str.length*2;var UTF32ToString=(ptr,maxBytesToRead)=>{var i=0;var str="";while(!(i>=maxBytesToRead/4)){var utf32=HEAP32[ptr+i*4>>2];if(utf32==0)break;++i;if(utf32>=65536){var ch=utf32-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}else {str+=String.fromCharCode(utf32);}}return str};var stringToUTF32=(str,outPtr,maxBytesToWrite)=>{maxBytesToWrite??=2147483647;if(maxBytesToWrite<4)return 0;var startPtr=outPtr;var endPtr=startPtr+maxBytesToWrite-4;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343){var trailSurrogate=str.charCodeAt(++i);codeUnit=65536+((codeUnit&1023)<<10)|trailSurrogate&1023;}HEAP32[outPtr>>2]=codeUnit;outPtr+=4;if(outPtr+4>endPtr)break}HEAP32[outPtr>>2]=0;return outPtr-startPtr};var lengthBytesUTF32=str=>{var len=0;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343)++i;len+=4;}return len};var __embind_register_std_wstring=(rawType,charSize,name)=>{name=readLatin1String(name);var decodeString,encodeString,readCharAt,lengthBytesUTF;if(charSize===2){decodeString=UTF16ToString;encodeString=stringToUTF16;lengthBytesUTF=lengthBytesUTF16;readCharAt=pointer=>HEAPU16[pointer>>1];}else if(charSize===4){decodeString=UTF32ToString;encodeString=stringToUTF32;lengthBytesUTF=lengthBytesUTF32;readCharAt=pointer=>HEAPU32[pointer>>2];}registerType(rawType,{name:name,"fromWireType":value=>{var length=HEAPU32[value>>2];var str;var decodeStartPtr=value+4;for(var i=0;i<=length;++i){var currentBytePtr=value+4+i*charSize;if(i==length||readCharAt(currentBytePtr)==0){var maxReadBytes=currentBytePtr-decodeStartPtr;var stringSegment=decodeString(decodeStartPtr,maxReadBytes);if(str===undefined){str=stringSegment;}else {str+=String.fromCharCode(0);str+=stringSegment;}decodeStartPtr=currentBytePtr+charSize;}}_free(value);return str},"toWireType":(destructors,value)=>{if(!(typeof value=="string")){throwBindingError(`Cannot pass non-string to C++ string type ${name}`);}var length=lengthBytesUTF(value);var ptr=_malloc(4+length+charSize);HEAPU32[ptr>>2]=length/charSize;encodeString(value,ptr+4,length+charSize);if(destructors!==null){destructors.push(_free,ptr);}return ptr},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction(ptr){_free(ptr);}});};var __embind_register_value_object=(rawType,name,constructorSignature,rawConstructor,destructorSignature,rawDestructor)=>{structRegistrations[rawType]={name:readLatin1String(name),rawConstructor:embind__requireFunction(constructorSignature,rawConstructor),rawDestructor:embind__requireFunction(destructorSignature,rawDestructor),fields:[]};};var __embind_register_value_object_field=(structType,fieldName,getterReturnType,getterSignature,getter,getterContext,setterArgumentType,setterSignature,setter,setterContext)=>{structRegistrations[structType].fields.push({fieldName:readLatin1String(fieldName),getterReturnType:getterReturnType,getter:embind__requireFunction(getterSignature,getter),getterContext:getterContext,setterArgumentType:setterArgumentType,setter:embind__requireFunction(setterSignature,setter),setterContext:setterContext});};var __embind_register_void=(rawType,name)=>{name=readLatin1String(name);registerType(rawType,{isVoid:true,name:name,"argPackAdvance":0,"fromWireType":()=>undefined,"toWireType":(destructors,o)=>undefined});};var __emscripten_memcpy_js=(dest,src,num)=>HEAPU8.copyWithin(dest,src,src+num);var emval_methodCallers=[];var __emval_call=(caller,handle,destructorsRef,args)=>{caller=emval_methodCallers[caller];handle=Emval.toValue(handle);return caller(null,handle,destructorsRef,args)};var emval_symbols={};var getStringOrSymbol=address=>{var symbol=emval_symbols[address];if(symbol===undefined){return readLatin1String(address)}return symbol};var emval_get_global=()=>{if(typeof globalThis=="object"){return globalThis}function testGlobal(obj){obj["$$$embind_global$$$"]=obj;var success=typeof $$$embind_global$$$=="object"&&obj["$$$embind_global$$$"]==obj;if(!success){delete obj["$$$embind_global$$$"];}return success}if(typeof $$$embind_global$$$=="object"){return $$$embind_global$$$}if(typeof global=="object"&&testGlobal(global)){$$$embind_global$$$=global;}else if(typeof self=="object"&&testGlobal(self)){$$$embind_global$$$=self;}if(typeof $$$embind_global$$$=="object"){return $$$embind_global$$$}throw Error("unable to get global object.")};var __emval_get_global=name=>{if(name===0){return Emval.toHandle(emval_get_global())}else {name=getStringOrSymbol(name);return Emval.toHandle(emval_get_global()[name])}};var emval_addMethodCaller=caller=>{var id=emval_methodCallers.length;emval_methodCallers.push(caller);return id};var requireRegisteredType=(rawType,humanName)=>{var impl=registeredTypes[rawType];if(undefined===impl){throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);}return impl};var emval_lookupTypes=(argCount,argTypes)=>{var a=new Array(argCount);for(var i=0;i<argCount;++i){a[i]=requireRegisteredType(HEAPU32[argTypes+i*4>>2],"parameter "+i);}return a};var reflectConstruct=Reflect.construct;var emval_returnValue=(returnType,destructorsRef,handle)=>{var destructors=[];var result=returnType["toWireType"](destructors,handle);if(destructors.length){HEAPU32[destructorsRef>>2]=Emval.toHandle(destructors);}return result};var __emval_get_method_caller=(argCount,argTypes,kind)=>{var types=emval_lookupTypes(argCount,argTypes);var retType=types.shift();argCount--;var argN=new Array(argCount);var invokerFunction=(obj,func,destructorsRef,args)=>{var offset=0;for(var i=0;i<argCount;++i){argN[i]=types[i]["readValueFromPointer"](args+offset);offset+=types[i]["argPackAdvance"];}var rv=kind===1?reflectConstruct(func,argN):func.apply(obj,argN);return emval_returnValue(retType,destructorsRef,rv)};var functionName=`methodCaller<(${types.map(t=>t.name).join(", ")}) => ${retType.name}>`;return emval_addMethodCaller(createNamedFunction(functionName,invokerFunction))};var __emval_run_destructors=handle=>{var destructors=Emval.toValue(handle);runDestructors(destructors);__emval_decref(handle);};var _abort=()=>{abort("");};var getHeapMax=()=>2147483648;var growMemory=size=>{var b=wasmMemory.buffer;var pages=(size-b.byteLength+65535)/65536;try{wasmMemory.grow(pages);updateMemoryViews();return 1}catch(e){}};var _emscripten_resize_heap=requestedSize=>{var oldSize=HEAPU8.length;requestedSize>>>=0;var maxHeapSize=getHeapMax();if(requestedSize>maxHeapSize){return false}var alignUp=(x,multiple)=>x+(multiple-x%multiple)%multiple;for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=growMemory(newSize);if(replacement){return true}}return false};var ENV={};var getExecutableName=()=>thisProgram||"./this.program";var getEnvStrings=()=>{if(!getEnvStrings.strings){var lang=(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x];}var strings=[];for(var x in env){strings.push(`${x}=${env[x]}`);}getEnvStrings.strings=strings;}return getEnvStrings.strings};var stringToAscii=(str,buffer)=>{for(var i=0;i<str.length;++i){HEAP8[buffer++]=str.charCodeAt(i);}HEAP8[buffer]=0;};var _environ_get=(__environ,environ_buf)=>{var bufSize=0;getEnvStrings().forEach((string,i)=>{var ptr=environ_buf+bufSize;HEAPU32[__environ+i*4>>2]=ptr;stringToAscii(string,ptr);bufSize+=string.length+1;});return 0};var _environ_sizes_get=(penviron_count,penviron_buf_size)=>{var strings=getEnvStrings();HEAPU32[penviron_count>>2]=strings.length;var bufSize=0;strings.forEach(string=>bufSize+=string.length+1);HEAPU32[penviron_buf_size>>2]=bufSize;return 0};var runtimeKeepaliveCounter=0;var keepRuntimeAlive=()=>noExitRuntime||runtimeKeepaliveCounter>0;var _proc_exit=code=>{EXITSTATUS=code;if(!keepRuntimeAlive()){Module["onExit"]?.(code);ABORT=true;}quit_(code,new ExitStatus(code));};var exitJS=(status,implicit)=>{EXITSTATUS=status;_proc_exit(status);};var _exit=exitJS;var _fd_close=fd=>52;var convertI32PairToI53Checked=(lo,hi)=>hi+2097152>>>0<4194305-!!lo?(lo>>>0)+hi*4294967296:NaN;function _fd_seek(fd,offset_low,offset_high,whence,newOffset){var offset=convertI32PairToI53Checked(offset_low,offset_high);return 70}var printCharBuffers=[null,[],[]];var printChar=(stream,curr)=>{var buffer=printCharBuffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0;}else {buffer.push(curr);}};var _fd_write=(fd,iov,iovcnt,pnum)=>{var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAPU32[iov>>2];var len=HEAPU32[iov+4>>2];iov+=8;for(var j=0;j<len;j++){printChar(fd,HEAPU8[ptr+j]);}num+=len;}HEAPU32[pnum>>2]=num;return 0};InternalError=Module["InternalError"]=class InternalError extends Error{constructor(message){super(message);this.name="InternalError";}};embind_init_charCodes();BindingError=Module["BindingError"]=class BindingError extends Error{constructor(message){super(message);this.name="BindingError";}};init_emval();UnboundTypeError=Module["UnboundTypeError"]=extendError(Error,"UnboundTypeError");var wasmImports={j:___cxa_throw,k:__embind_finalize_value_object,n:__embind_register_bigint,h:__embind_register_bool,z:__embind_register_emval,f:__embind_register_float,e:__embind_register_function,c:__embind_register_integer,a:__embind_register_memory_view,g:__embind_register_std_string,d:__embind_register_std_wstring,l:__embind_register_value_object,b:__embind_register_value_object_field,i:__embind_register_void,s:__emscripten_memcpy_js,y:__emval_call,u:__emval_decref,A:__emval_get_global,x:__emval_get_method_caller,w:__emval_run_destructors,o:_abort,p:_emscripten_resize_heap,q:_environ_get,r:_environ_sizes_get,B:_exit,t:_fd_close,m:_fd_seek,v:_fd_write};var wasmExports=createWasm();var ___wasm_call_ctors=()=>(___wasm_call_ctors=wasmExports["D"])();var ___getTypeName=a0=>(___getTypeName=wasmExports["E"])(a0);var _malloc=a0=>(_malloc=wasmExports["F"])(a0);var _free=a0=>(_free=wasmExports["G"])(a0);var __emscripten_stack_restore=a0=>(__emscripten_stack_restore=wasmExports["_emscripten_stack_restore"])(a0);var __emscripten_stack_alloc=a0=>(__emscripten_stack_alloc=wasmExports["_emscripten_stack_alloc"])(a0);var _emscripten_stack_get_current=()=>(_emscripten_stack_get_current=wasmExports["emscripten_stack_get_current"])();var ___cxa_increment_exception_refcount=a0=>(___cxa_increment_exception_refcount=wasmExports["__cxa_increment_exception_refcount"])(a0);var ___cxa_is_pointer_type=a0=>(___cxa_is_pointer_type=wasmExports["I"])(a0);var dynCall_jiji=Module["dynCall_jiji"]=(a0,a1,a2,a3,a4)=>(dynCall_jiji=Module["dynCall_jiji"]=wasmExports["J"])(a0,a1,a2,a3,a4);var calledRun;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller;};function run(){if(runDependencies>0){return}preRun();if(runDependencies>0){return}function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();readyPromiseResolve(Module);if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("");},1);doRun();},1);}else {doRun();}}if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()();}}run();


  return readyPromise
}
);
})();

const label = 'MozJPEG';
const mimeType = 'image/jpeg';
const extension = 'jpg';
const defaultOptions = {
    quality: 75,
    baseline: false,
    arithmetic: false,
    progressive: true,
    optimize_coding: true,
    smoothing: 0,
    color_space: 3 /* MozJpegColorSpace.YCbCr */,
    quant_table: 3,
    trellis_multipass: false,
    trellis_opt_zero: false,
    trellis_opt_table: false,
    trellis_loops: 1,
    auto_subsample: true,
    chroma_subsample: 2,
    separate_chroma_quality: false,
    chroma_quality: 75,
};
const defaultEncodeOptions = defaultOptions;
const defaultDecodeOptions = {
    preserveOrientation: false,
};

/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Notice: I (Jamie Sinclair) have modified this file to allow manual instantiation of the Wasm Module.
 */
function initEmscriptenModule(moduleFactory, wasmModule, moduleOptionOverrides = {}) {
    let instantiateWasm;
    if (wasmModule) {
        instantiateWasm = (imports, callback) => {
            const instance = new WebAssembly.Instance(wasmModule, imports);
            callback(instance);
            return instance.exports;
        };
    }
    return moduleFactory({
        // Just to be safe, don't automatically invoke any wasm functions
        noInitialRun: true,
        instantiateWasm,
        ...moduleOptionOverrides,
    });
}

/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let emscriptenModule$1;
async function init$1(module, moduleOptionOverrides) {
    let actualModule = module;
    let actualOptions = moduleOptionOverrides;
    // If only one argument is provided and it's not a WebAssembly.Module
    if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
        actualModule = undefined;
        actualOptions = module;
    }
    emscriptenModule$1 = initEmscriptenModule(Module$1, actualModule, actualOptions);
}
async function encode(data, options = {}) {
    if (!emscriptenModule$1)
        init$1();
    const module = await emscriptenModule$1;
    const _options = { ...defaultOptions, ...options };
    const resultView = module.encode(data.data, data.width, data.height, _options);
    // wasm can't run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
    return resultView.buffer;
}

var Module = (() => {
  var _scriptDir = import.meta.url;
  
  return (
function(moduleArg = {}) {

var Module=moduleArg;var readyPromiseResolve,readyPromiseReject;var readyPromise=new Promise((resolve,reject)=>{readyPromiseResolve=resolve;readyPromiseReject=reject;});const isServiceWorker=globalThis.ServiceWorkerGlobalScope!==undefined;const isRunningInCloudFlareWorkers=isServiceWorker&&typeof self!=="undefined"&&globalThis.caches&&globalThis.caches.default!==undefined;const isRunningInNode=typeof process==="object"&&process.release&&process.release.name==="node";if(isRunningInCloudFlareWorkers||isRunningInNode){if(!globalThis.ImageData){globalThis.ImageData=class ImageData{constructor(data,width,height){this.data=data;this.width=width;this.height=height;}};}if(import.meta.url===undefined){import.meta.url="https://localhost";}if(typeof self!=="undefined"&&self.location===undefined){self.location={href:""};}}var moduleOverrides=Object.assign({},Module);var arguments_=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow};var ENVIRONMENT_IS_WEB=typeof window=="object";var ENVIRONMENT_IS_WORKER=typeof importScripts=="function";var ENVIRONMENT_IS_NODE=typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string";var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href;}else if(typeof document!="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src;}if(_scriptDir){scriptDirectory=_scriptDir;}if(scriptDirectory.startsWith("blob:")){scriptDirectory="";}else {scriptDirectory=scriptDirectory.substr(0,scriptDirectory.replace(/[?#].*/,"").lastIndexOf("/")+1);}{read_=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)};}readAsync=(url,onload,onerror)=>{var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=()=>{if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror();};xhr.onerror=onerror;xhr.send(null);};}}else {}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.error.bind(console);Object.assign(Module,moduleOverrides);moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var wasmMemory;var ABORT=false;var EXITSTATUS;var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateMemoryViews(){var b=wasmMemory.buffer;Module["HEAP8"]=HEAP8=new Int8Array(b);Module["HEAP16"]=HEAP16=new Int16Array(b);Module["HEAPU8"]=HEAPU8=new Uint8Array(b);Module["HEAPU16"]=HEAPU16=new Uint16Array(b);Module["HEAP32"]=HEAP32=new Int32Array(b);Module["HEAPU32"]=HEAPU32=new Uint32Array(b);Module["HEAPF32"]=HEAPF32=new Float32Array(b);Module["HEAPF64"]=HEAPF64=new Float64Array(b);}var __ATPRERUN__=[];var __ATINIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__);}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}function addOnInit(cb){__ATINIT__.unshift(cb);}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;Module["monitorRunDependencies"]?.(runDependencies);}function removeRunDependency(id){runDependencies--;Module["monitorRunDependencies"]?.(runDependencies);if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null;}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}}}function abort(what){Module["onAbort"]?.(what);what="Aborted("+what+")";err(what);ABORT=true;EXITSTATUS=1;what+=". Build with -sASSERTIONS for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e}var dataURIPrefix="data:application/octet-stream;base64,";var isDataURI=filename=>filename.startsWith(dataURIPrefix);var wasmBinaryFile;if(Module["locateFile"]){wasmBinaryFile="mozjpeg_dec.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile);}}else {wasmBinaryFile=new URL(""+new URL('../assets/mozjpeg_dec.wasm', import.meta.url).href+"", import.meta.url).href;}function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}throw "both async and sync fetching of the wasm failed"}function getBinaryPromise(binaryFile){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch=="function"){return fetch(binaryFile,{credentials:"same-origin"}).then(response=>{if(!response["ok"]){throw `failed to load wasm binary file at '${binaryFile}'`}return response["arrayBuffer"]()}).catch(()=>getBinarySync(binaryFile))}}return Promise.resolve().then(()=>getBinarySync(binaryFile))}function instantiateArrayBuffer(binaryFile,imports,receiver){return getBinaryPromise(binaryFile).then(binary=>WebAssembly.instantiate(binary,imports)).then(receiver,reason=>{err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason);})}function instantiateAsync(binary,binaryFile,imports,callback){if(!binary&&typeof WebAssembly.instantiateStreaming=="function"&&!isDataURI(binaryFile)&&typeof fetch=="function"){return fetch(binaryFile,{credentials:"same-origin"}).then(response=>{var result=WebAssembly.instantiateStreaming(response,imports);return result.then(callback,function(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(binaryFile,imports,callback)})})}return instantiateArrayBuffer(binaryFile,imports,callback)}function createWasm(){var info={"a":wasmImports};function receiveInstance(instance,module){wasmExports=instance.exports;wasmMemory=wasmExports["A"];updateMemoryViews();wasmTable=wasmExports["F"];addOnInit(wasmExports["B"]);removeRunDependency("wasm-instantiate");return wasmExports}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){receiveInstance(result["instance"]);}if(Module["instantiateWasm"]){try{return Module["instantiateWasm"](info,receiveInstance)}catch(e){err(`Module.instantiateWasm callback failed with error: ${e}`);readyPromiseReject(e);}}instantiateAsync(wasmBinary,wasmBinaryFile,info,receiveInstantiationResult).catch(readyPromiseReject);return {}}function ExitStatus(status){this.name="ExitStatus";this.message=`Program terminated with exit(${status})`;this.status=status;}var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module);}};var noExitRuntime=Module["noExitRuntime"]||true;class ExceptionInfo{constructor(excPtr){this.excPtr=excPtr;this.ptr=excPtr-24;}set_type(type){HEAPU32[this.ptr+4>>2]=type;}get_type(){return HEAPU32[this.ptr+4>>2]}set_destructor(destructor){HEAPU32[this.ptr+8>>2]=destructor;}get_destructor(){return HEAPU32[this.ptr+8>>2]}set_caught(caught){caught=caught?1:0;HEAP8[this.ptr+12]=caught;}get_caught(){return HEAP8[this.ptr+12]!=0}set_rethrown(rethrown){rethrown=rethrown?1:0;HEAP8[this.ptr+13]=rethrown;}get_rethrown(){return HEAP8[this.ptr+13]!=0}init(type,destructor){this.set_adjusted_ptr(0);this.set_type(type);this.set_destructor(destructor);}set_adjusted_ptr(adjustedPtr){HEAPU32[this.ptr+16>>2]=adjustedPtr;}get_adjusted_ptr(){return HEAPU32[this.ptr+16>>2]}get_exception_ptr(){var isPointer=___cxa_is_pointer_type(this.get_type());if(isPointer){return HEAPU32[this.excPtr>>2]}var adjusted=this.get_adjusted_ptr();if(adjusted!==0)return adjusted;return this.excPtr}}var exceptionLast=0;var uncaughtExceptionCount=0;var ___cxa_throw=(ptr,type,destructor)=>{var info=new ExceptionInfo(ptr);info.init(type,destructor);exceptionLast=ptr;uncaughtExceptionCount++;throw exceptionLast};var __embind_register_bigint=(primitiveType,name,size,minRange,maxRange)=>{};var embind_init_charCodes=()=>{var codes=new Array(256);for(var i=0;i<256;++i){codes[i]=String.fromCharCode(i);}embind_charCodes=codes;};var embind_charCodes;var readLatin1String=ptr=>{var ret="";var c=ptr;while(HEAPU8[c]){ret+=embind_charCodes[HEAPU8[c++]];}return ret};var awaitingDependencies={};var registeredTypes={};var typeDependencies={};var BindingError;var throwBindingError=message=>{throw new BindingError(message)};var InternalError;var throwInternalError=message=>{throw new InternalError(message)};var whenDependentTypesAreResolved=(myTypes,dependentTypes,getTypeConverters)=>{myTypes.forEach(function(type){typeDependencies[type]=dependentTypes;});function onComplete(typeConverters){var myTypeConverters=getTypeConverters(typeConverters);if(myTypeConverters.length!==myTypes.length){throwInternalError("Mismatched type converter count");}for(var i=0;i<myTypes.length;++i){registerType(myTypes[i],myTypeConverters[i]);}}var typeConverters=new Array(dependentTypes.length);var unregisteredTypes=[];var registered=0;dependentTypes.forEach((dt,i)=>{if(registeredTypes.hasOwnProperty(dt)){typeConverters[i]=registeredTypes[dt];}else {unregisteredTypes.push(dt);if(!awaitingDependencies.hasOwnProperty(dt)){awaitingDependencies[dt]=[];}awaitingDependencies[dt].push(()=>{typeConverters[i]=registeredTypes[dt];++registered;if(registered===unregisteredTypes.length){onComplete(typeConverters);}});}});if(0===unregisteredTypes.length){onComplete(typeConverters);}};function sharedRegisterType(rawType,registeredInstance,options={}){var name=registeredInstance.name;if(!rawType){throwBindingError(`type "${name}" must have a positive integer typeid pointer`);}if(registeredTypes.hasOwnProperty(rawType)){if(options.ignoreDuplicateRegistrations){return}else {throwBindingError(`Cannot register type '${name}' twice`);}}registeredTypes[rawType]=registeredInstance;delete typeDependencies[rawType];if(awaitingDependencies.hasOwnProperty(rawType)){var callbacks=awaitingDependencies[rawType];delete awaitingDependencies[rawType];callbacks.forEach(cb=>cb());}}function registerType(rawType,registeredInstance,options={}){if(!("argPackAdvance"in registeredInstance)){throw new TypeError("registerType registeredInstance requires argPackAdvance")}return sharedRegisterType(rawType,registeredInstance,options)}var GenericWireTypeSize=8;var __embind_register_bool=(rawType,name,trueValue,falseValue)=>{name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":function(wt){return !!wt},"toWireType":function(destructors,o){return o?trueValue:falseValue},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":function(pointer){return this["fromWireType"](HEAPU8[pointer])},destructorFunction:null});};var emval_freelist=[];var emval_handles=[];var __emval_decref=handle=>{if(handle>9&&0===--emval_handles[handle+1]){emval_handles[handle]=undefined;emval_freelist.push(handle);}};var count_emval_handles=()=>emval_handles.length/2-5-emval_freelist.length;var init_emval=()=>{emval_handles.push(0,1,undefined,1,null,1,true,1,false,1);Module["count_emval_handles"]=count_emval_handles;};var Emval={toValue:handle=>{if(!handle){throwBindingError("Cannot use deleted val. handle = "+handle);}return emval_handles[handle]},toHandle:value=>{switch(value){case undefined:return 2;case null:return 4;case true:return 6;case false:return 8;default:{const handle=emval_freelist.pop()||emval_handles.length;emval_handles[handle]=value;emval_handles[handle+1]=1;return handle}}}};function readPointer(pointer){return this["fromWireType"](HEAPU32[pointer>>2])}var EmValType={name:"emscripten::val","fromWireType":handle=>{var rv=Emval.toValue(handle);__emval_decref(handle);return rv},"toWireType":(destructors,value)=>Emval.toHandle(value),"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction:null};var __embind_register_emval=rawType=>registerType(rawType,EmValType);var floatReadValueFromPointer=(name,width)=>{switch(width){case 4:return function(pointer){return this["fromWireType"](HEAPF32[pointer>>2])};case 8:return function(pointer){return this["fromWireType"](HEAPF64[pointer>>3])};default:throw new TypeError(`invalid float width (${width}): ${name}`)}};var __embind_register_float=(rawType,name,size)=>{name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":value=>value,"toWireType":(destructors,value)=>value,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":floatReadValueFromPointer(name,size),destructorFunction:null});};var createNamedFunction=(name,body)=>Object.defineProperty(body,"name",{value:name});var runDestructors=destructors=>{while(destructors.length){var ptr=destructors.pop();var del=destructors.pop();del(ptr);}};function usesDestructorStack(argTypes){for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){return true}}return false}function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=usesDestructorStack(argTypes);var returns=argTypes[0].name!=="void";var expectedArgCount=argCount-2;var argsWired=new Array(expectedArgCount);var invokerFuncArgs=[];var destructors=[];var invokerFn=function(...args){if(args.length!==expectedArgCount){throwBindingError(`function ${humanName} called with ${args.length} arguments, expected ${expectedArgCount}`);}destructors.length=0;var thisWired;invokerFuncArgs.length=isClassMethodFunc?2:1;invokerFuncArgs[0]=cppTargetFunc;if(isClassMethodFunc){thisWired=argTypes[1]["toWireType"](destructors,this);invokerFuncArgs[1]=thisWired;}for(var i=0;i<expectedArgCount;++i){argsWired[i]=argTypes[i+2]["toWireType"](destructors,args[i]);invokerFuncArgs.push(argsWired[i]);}var rv=cppInvokerFunc(...invokerFuncArgs);function onDone(rv){if(needsDestructorStack){runDestructors(destructors);}else {for(var i=isClassMethodFunc?1:2;i<argTypes.length;i++){var param=i===1?thisWired:argsWired[i-2];if(argTypes[i].destructorFunction!==null){argTypes[i].destructorFunction(param);}}}if(returns){return argTypes[0]["fromWireType"](rv)}}return onDone(rv)};return createNamedFunction(humanName,invokerFn)}var ensureOverloadTable=(proto,methodName,humanName)=>{if(undefined===proto[methodName].overloadTable){var prevFunc=proto[methodName];proto[methodName]=function(...args){if(!proto[methodName].overloadTable.hasOwnProperty(args.length)){throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);}return proto[methodName].overloadTable[args.length].apply(this,args)};proto[methodName].overloadTable=[];proto[methodName].overloadTable[prevFunc.argCount]=prevFunc;}};var exposePublicSymbol=(name,value,numArguments)=>{if(Module.hasOwnProperty(name)){if(undefined===numArguments||undefined!==Module[name].overloadTable&&undefined!==Module[name].overloadTable[numArguments]){throwBindingError(`Cannot register public name '${name}' twice`);}ensureOverloadTable(Module,name,name);if(Module.hasOwnProperty(numArguments)){throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);}Module[name].overloadTable[numArguments]=value;}else {Module[name]=value;if(undefined!==numArguments){Module[name].numArguments=numArguments;}}};var heap32VectorToArray=(count,firstElement)=>{var array=[];for(var i=0;i<count;i++){array.push(HEAPU32[firstElement+i*4>>2]);}return array};var replacePublicSymbol=(name,value,numArguments)=>{if(!Module.hasOwnProperty(name)){throwInternalError("Replacing nonexistent public symbol");}if(undefined!==Module[name].overloadTable&&undefined!==numArguments){Module[name].overloadTable[numArguments]=value;}else {Module[name]=value;Module[name].argCount=numArguments;}};var dynCallLegacy=(sig,ptr,args)=>{sig=sig.replace(/p/g,"i");var f=Module["dynCall_"+sig];return f(ptr,...args)};var wasmTableMirror=[];var wasmTable;var getWasmTableEntry=funcPtr=>{var func=wasmTableMirror[funcPtr];if(!func){if(funcPtr>=wasmTableMirror.length)wasmTableMirror.length=funcPtr+1;wasmTableMirror[funcPtr]=func=wasmTable.get(funcPtr);}return func};var dynCall=(sig,ptr,args=[])=>{if(sig.includes("j")){return dynCallLegacy(sig,ptr,args)}var rtn=getWasmTableEntry(ptr)(...args);return rtn};var getDynCaller=(sig,ptr)=>(...args)=>dynCall(sig,ptr,args);var embind__requireFunction=(signature,rawFunction)=>{signature=readLatin1String(signature);function makeDynCaller(){if(signature.includes("j")){return getDynCaller(signature,rawFunction)}return getWasmTableEntry(rawFunction)}var fp=makeDynCaller();if(typeof fp!="function"){throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);}return fp};var extendError=(baseErrorType,errorName)=>{var errorClass=createNamedFunction(errorName,function(message){this.name=errorName;this.message=message;var stack=new Error(message).stack;if(stack!==undefined){this.stack=this.toString()+"\n"+stack.replace(/^Error(:[^\n]*)?\n/,"");}});errorClass.prototype=Object.create(baseErrorType.prototype);errorClass.prototype.constructor=errorClass;errorClass.prototype.toString=function(){if(this.message===undefined){return this.name}else {return `${this.name}: ${this.message}`}};return errorClass};var UnboundTypeError;var getTypeName=type=>{var ptr=___getTypeName(type);var rv=readLatin1String(ptr);_free(ptr);return rv};var throwUnboundTypeError=(message,types)=>{var unboundTypes=[];var seen={};function visit(type){if(seen[type]){return}if(registeredTypes[type]){return}if(typeDependencies[type]){typeDependencies[type].forEach(visit);return}unboundTypes.push(type);seen[type]=true;}types.forEach(visit);throw new UnboundTypeError(`${message}: `+unboundTypes.map(getTypeName).join([", "]))};var getFunctionName=signature=>{signature=signature.trim();const argsIndex=signature.indexOf("(");if(argsIndex!==-1){return signature.substr(0,argsIndex)}else {return signature}};var __embind_register_function=(name,argCount,rawArgTypesAddr,signature,rawInvoker,fn,isAsync)=>{var argTypes=heap32VectorToArray(argCount,rawArgTypesAddr);name=readLatin1String(name);name=getFunctionName(name);rawInvoker=embind__requireFunction(signature,rawInvoker);exposePublicSymbol(name,function(){throwUnboundTypeError(`Cannot call ${name} due to unbound types`,argTypes);},argCount-1);whenDependentTypesAreResolved([],argTypes,argTypes=>{var invokerArgsArray=[argTypes[0],null].concat(argTypes.slice(1));replacePublicSymbol(name,craftInvokerFunction(name,invokerArgsArray,null,rawInvoker,fn,isAsync),argCount-1);return []});};var integerReadValueFromPointer=(name,width,signed)=>{switch(width){case 1:return signed?pointer=>HEAP8[pointer]:pointer=>HEAPU8[pointer];case 2:return signed?pointer=>HEAP16[pointer>>1]:pointer=>HEAPU16[pointer>>1];case 4:return signed?pointer=>HEAP32[pointer>>2]:pointer=>HEAPU32[pointer>>2];default:throw new TypeError(`invalid integer width (${width}): ${name}`)}};var __embind_register_integer=(primitiveType,name,size,minRange,maxRange)=>{name=readLatin1String(name);if(maxRange===-1){maxRange=4294967295;}var fromWireType=value=>value;if(minRange===0){var bitshift=32-8*size;fromWireType=value=>value<<bitshift>>>bitshift;}var isUnsignedType=name.includes("unsigned");var checkAssertions=(value,toTypeName)=>{};var toWireType;if(isUnsignedType){toWireType=function(destructors,value){checkAssertions(value,this.name);return value>>>0};}else {toWireType=function(destructors,value){checkAssertions(value,this.name);return value};}registerType(primitiveType,{name:name,"fromWireType":fromWireType,"toWireType":toWireType,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":integerReadValueFromPointer(name,size,minRange!==0),destructorFunction:null});};var __embind_register_memory_view=(rawType,dataTypeIndex,name)=>{var typeMapping=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array];var TA=typeMapping[dataTypeIndex];function decodeMemoryView(handle){var size=HEAPU32[handle>>2];var data=HEAPU32[handle+4>>2];return new TA(HEAP8.buffer,data,size)}name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":decodeMemoryView,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":decodeMemoryView},{ignoreDuplicateRegistrations:true});};var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023;}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u;}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63;}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}else {if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63;}}heap[outIdx]=0;return outIdx-startIdx};var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite);var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++;}else if(c<=2047){len+=2;}else if(c>=55296&&c<=57343){len+=4;++i;}else {len+=3;}}return len};var UTF8ArrayToString=(heapOrArray,idx,maxBytesToRead)=>{var endIdx=idx+maxBytesToRead;var str="";while(!(idx>=endIdx)){var u0=heapOrArray[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2;}else {u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63;}if(u0<65536){str+=String.fromCharCode(u0);}else {var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}}return str};var UTF8ToString=(ptr,maxBytesToRead)=>ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):"";var __embind_register_std_string=(rawType,name)=>{name=readLatin1String(name);var stdStringIsUTF8=name==="std::string";registerType(rawType,{name:name,"fromWireType"(value){var length=HEAPU32[value>>2];var payload=value+4;var str;if(stdStringIsUTF8){var decodeStartPtr=payload;for(var i=0;i<=length;++i){var currentBytePtr=payload+i;if(i==length||HEAPU8[currentBytePtr]==0){var maxRead=currentBytePtr-decodeStartPtr;var stringSegment=UTF8ToString(decodeStartPtr,maxRead);if(str===undefined){str=stringSegment;}else {str+=String.fromCharCode(0);str+=stringSegment;}decodeStartPtr=currentBytePtr+1;}}}else {var a=new Array(length);for(var i=0;i<length;++i){a[i]=String.fromCharCode(HEAPU8[payload+i]);}str=a.join("");}_free(value);return str},"toWireType"(destructors,value){if(value instanceof ArrayBuffer){value=new Uint8Array(value);}var length;var valueIsOfTypeString=typeof value=="string";if(!(valueIsOfTypeString||value instanceof Uint8Array||value instanceof Uint8ClampedArray||value instanceof Int8Array)){throwBindingError("Cannot pass non-string to std::string");}if(stdStringIsUTF8&&valueIsOfTypeString){length=lengthBytesUTF8(value);}else {length=value.length;}var base=_malloc(4+length+1);var ptr=base+4;HEAPU32[base>>2]=length;if(stdStringIsUTF8&&valueIsOfTypeString){stringToUTF8(value,ptr,length+1);}else {if(valueIsOfTypeString){for(var i=0;i<length;++i){var charCode=value.charCodeAt(i);if(charCode>255){_free(ptr);throwBindingError("String has UTF-16 code units that do not fit in 8 bits");}HEAPU8[ptr+i]=charCode;}}else {for(var i=0;i<length;++i){HEAPU8[ptr+i]=value[i];}}}if(destructors!==null){destructors.push(_free,base);}return base},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction(ptr){_free(ptr);}});};var UTF16ToString=(ptr,maxBytesToRead)=>{var str="";for(var i=0;!(i>=maxBytesToRead/2);++i){var codeUnit=HEAP16[ptr+i*2>>1];if(codeUnit==0)break;str+=String.fromCharCode(codeUnit);}return str};var stringToUTF16=(str,outPtr,maxBytesToWrite)=>{maxBytesToWrite??=2147483647;if(maxBytesToWrite<2)return 0;maxBytesToWrite-=2;var startPtr=outPtr;var numCharsToWrite=maxBytesToWrite<str.length*2?maxBytesToWrite/2:str.length;for(var i=0;i<numCharsToWrite;++i){var codeUnit=str.charCodeAt(i);HEAP16[outPtr>>1]=codeUnit;outPtr+=2;}HEAP16[outPtr>>1]=0;return outPtr-startPtr};var lengthBytesUTF16=str=>str.length*2;var UTF32ToString=(ptr,maxBytesToRead)=>{var i=0;var str="";while(!(i>=maxBytesToRead/4)){var utf32=HEAP32[ptr+i*4>>2];if(utf32==0)break;++i;if(utf32>=65536){var ch=utf32-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}else {str+=String.fromCharCode(utf32);}}return str};var stringToUTF32=(str,outPtr,maxBytesToWrite)=>{maxBytesToWrite??=2147483647;if(maxBytesToWrite<4)return 0;var startPtr=outPtr;var endPtr=startPtr+maxBytesToWrite-4;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343){var trailSurrogate=str.charCodeAt(++i);codeUnit=65536+((codeUnit&1023)<<10)|trailSurrogate&1023;}HEAP32[outPtr>>2]=codeUnit;outPtr+=4;if(outPtr+4>endPtr)break}HEAP32[outPtr>>2]=0;return outPtr-startPtr};var lengthBytesUTF32=str=>{var len=0;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343)++i;len+=4;}return len};var __embind_register_std_wstring=(rawType,charSize,name)=>{name=readLatin1String(name);var decodeString,encodeString,readCharAt,lengthBytesUTF;if(charSize===2){decodeString=UTF16ToString;encodeString=stringToUTF16;lengthBytesUTF=lengthBytesUTF16;readCharAt=pointer=>HEAPU16[pointer>>1];}else if(charSize===4){decodeString=UTF32ToString;encodeString=stringToUTF32;lengthBytesUTF=lengthBytesUTF32;readCharAt=pointer=>HEAPU32[pointer>>2];}registerType(rawType,{name:name,"fromWireType":value=>{var length=HEAPU32[value>>2];var str;var decodeStartPtr=value+4;for(var i=0;i<=length;++i){var currentBytePtr=value+4+i*charSize;if(i==length||readCharAt(currentBytePtr)==0){var maxReadBytes=currentBytePtr-decodeStartPtr;var stringSegment=decodeString(decodeStartPtr,maxReadBytes);if(str===undefined){str=stringSegment;}else {str+=String.fromCharCode(0);str+=stringSegment;}decodeStartPtr=currentBytePtr+charSize;}}_free(value);return str},"toWireType":(destructors,value)=>{if(!(typeof value=="string")){throwBindingError(`Cannot pass non-string to C++ string type ${name}`);}var length=lengthBytesUTF(value);var ptr=_malloc(4+length+charSize);HEAPU32[ptr>>2]=length/charSize;encodeString(value,ptr+4,length+charSize);if(destructors!==null){destructors.push(_free,ptr);}return ptr},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction(ptr){_free(ptr);}});};var __embind_register_void=(rawType,name)=>{name=readLatin1String(name);registerType(rawType,{isVoid:true,name:name,"argPackAdvance":0,"fromWireType":()=>undefined,"toWireType":(destructors,o)=>undefined});};var __emscripten_memcpy_js=(dest,src,num)=>HEAPU8.copyWithin(dest,src,src+num);var emval_methodCallers=[];var __emval_call=(caller,handle,destructorsRef,args)=>{caller=emval_methodCallers[caller];handle=Emval.toValue(handle);return caller(null,handle,destructorsRef,args)};var emval_symbols={};var getStringOrSymbol=address=>{var symbol=emval_symbols[address];if(symbol===undefined){return readLatin1String(address)}return symbol};var emval_get_global=()=>{if(typeof globalThis=="object"){return globalThis}function testGlobal(obj){obj["$$$embind_global$$$"]=obj;var success=typeof $$$embind_global$$$=="object"&&obj["$$$embind_global$$$"]==obj;if(!success){delete obj["$$$embind_global$$$"];}return success}if(typeof $$$embind_global$$$=="object"){return $$$embind_global$$$}if(typeof global=="object"&&testGlobal(global)){$$$embind_global$$$=global;}else if(typeof self=="object"&&testGlobal(self)){$$$embind_global$$$=self;}if(typeof $$$embind_global$$$=="object"){return $$$embind_global$$$}throw Error("unable to get global object.")};var __emval_get_global=name=>{if(name===0){return Emval.toHandle(emval_get_global())}else {name=getStringOrSymbol(name);return Emval.toHandle(emval_get_global()[name])}};var emval_addMethodCaller=caller=>{var id=emval_methodCallers.length;emval_methodCallers.push(caller);return id};var requireRegisteredType=(rawType,humanName)=>{var impl=registeredTypes[rawType];if(undefined===impl){throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);}return impl};var emval_lookupTypes=(argCount,argTypes)=>{var a=new Array(argCount);for(var i=0;i<argCount;++i){a[i]=requireRegisteredType(HEAPU32[argTypes+i*4>>2],"parameter "+i);}return a};var reflectConstruct=Reflect.construct;var emval_returnValue=(returnType,destructorsRef,handle)=>{var destructors=[];var result=returnType["toWireType"](destructors,handle);if(destructors.length){HEAPU32[destructorsRef>>2]=Emval.toHandle(destructors);}return result};var __emval_get_method_caller=(argCount,argTypes,kind)=>{var types=emval_lookupTypes(argCount,argTypes);var retType=types.shift();argCount--;var argN=new Array(argCount);var invokerFunction=(obj,func,destructorsRef,args)=>{var offset=0;for(var i=0;i<argCount;++i){argN[i]=types[i]["readValueFromPointer"](args+offset);offset+=types[i]["argPackAdvance"];}var rv=kind===1?reflectConstruct(func,argN):func.apply(obj,argN);return emval_returnValue(retType,destructorsRef,rv)};var functionName=`methodCaller<(${types.map(t=>t.name).join(", ")}) => ${retType.name}>`;return emval_addMethodCaller(createNamedFunction(functionName,invokerFunction))};var __emval_incref=handle=>{if(handle>9){emval_handles[handle+1]+=1;}};var __emval_run_destructors=handle=>{var destructors=Emval.toValue(handle);runDestructors(destructors);__emval_decref(handle);};var _abort=()=>{abort("");};var getHeapMax=()=>2147483648;var growMemory=size=>{var b=wasmMemory.buffer;var pages=(size-b.byteLength+65535)/65536;try{wasmMemory.grow(pages);updateMemoryViews();return 1}catch(e){}};var _emscripten_resize_heap=requestedSize=>{var oldSize=HEAPU8.length;requestedSize>>>=0;var maxHeapSize=getHeapMax();if(requestedSize>maxHeapSize){return false}var alignUp=(x,multiple)=>x+(multiple-x%multiple)%multiple;for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(requestedSize,overGrownHeapSize),65536));var replacement=growMemory(newSize);if(replacement){return true}}return false};var ENV={};var getExecutableName=()=>thisProgram||"./this.program";var getEnvStrings=()=>{if(!getEnvStrings.strings){var lang=(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x];}var strings=[];for(var x in env){strings.push(`${x}=${env[x]}`);}getEnvStrings.strings=strings;}return getEnvStrings.strings};var stringToAscii=(str,buffer)=>{for(var i=0;i<str.length;++i){HEAP8[buffer++]=str.charCodeAt(i);}HEAP8[buffer]=0;};var _environ_get=(__environ,environ_buf)=>{var bufSize=0;getEnvStrings().forEach((string,i)=>{var ptr=environ_buf+bufSize;HEAPU32[__environ+i*4>>2]=ptr;stringToAscii(string,ptr);bufSize+=string.length+1;});return 0};var _environ_sizes_get=(penviron_count,penviron_buf_size)=>{var strings=getEnvStrings();HEAPU32[penviron_count>>2]=strings.length;var bufSize=0;strings.forEach(string=>bufSize+=string.length+1);HEAPU32[penviron_buf_size>>2]=bufSize;return 0};var runtimeKeepaliveCounter=0;var keepRuntimeAlive=()=>noExitRuntime||runtimeKeepaliveCounter>0;var _proc_exit=code=>{EXITSTATUS=code;if(!keepRuntimeAlive()){Module["onExit"]?.(code);ABORT=true;}quit_(code,new ExitStatus(code));};var exitJS=(status,implicit)=>{EXITSTATUS=status;_proc_exit(status);};var _exit=exitJS;var _fd_close=fd=>52;var convertI32PairToI53Checked=(lo,hi)=>hi+2097152>>>0<4194305-!!lo?(lo>>>0)+hi*4294967296:NaN;function _fd_seek(fd,offset_low,offset_high,whence,newOffset){var offset=convertI32PairToI53Checked(offset_low,offset_high);return 70}var printCharBuffers=[null,[],[]];var printChar=(stream,curr)=>{var buffer=printCharBuffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0;}else {buffer.push(curr);}};var _fd_write=(fd,iov,iovcnt,pnum)=>{var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAPU32[iov>>2];var len=HEAPU32[iov+4>>2];iov+=8;for(var j=0;j<len;j++){printChar(fd,HEAPU8[ptr+j]);}num+=len;}HEAPU32[pnum>>2]=num;return 0};embind_init_charCodes();BindingError=Module["BindingError"]=class BindingError extends Error{constructor(message){super(message);this.name="BindingError";}};InternalError=Module["InternalError"]=class InternalError extends Error{constructor(message){super(message);this.name="InternalError";}};init_emval();UnboundTypeError=Module["UnboundTypeError"]=extendError(Error,"UnboundTypeError");var wasmImports={o:___cxa_throw,q:__embind_register_bigint,m:__embind_register_bool,l:__embind_register_emval,j:__embind_register_float,f:__embind_register_function,b:__embind_register_integer,a:__embind_register_memory_view,e:__embind_register_std_string,c:__embind_register_std_wstring,n:__embind_register_void,v:__emscripten_memcpy_js,i:__emval_call,d:__emval_decref,k:__emval_get_global,h:__emval_get_method_caller,y:__emval_incref,g:__emval_run_destructors,r:_abort,s:_emscripten_resize_heap,t:_environ_get,u:_environ_sizes_get,z:_exit,w:_fd_close,p:_fd_seek,x:_fd_write};var wasmExports=createWasm();var ___wasm_call_ctors=()=>(___wasm_call_ctors=wasmExports["B"])();var ___getTypeName=a0=>(___getTypeName=wasmExports["C"])(a0);var _malloc=a0=>(_malloc=wasmExports["D"])(a0);var _free=a0=>(_free=wasmExports["E"])(a0);var __emscripten_stack_restore=a0=>(__emscripten_stack_restore=wasmExports["_emscripten_stack_restore"])(a0);var __emscripten_stack_alloc=a0=>(__emscripten_stack_alloc=wasmExports["_emscripten_stack_alloc"])(a0);var _emscripten_stack_get_current=()=>(_emscripten_stack_get_current=wasmExports["emscripten_stack_get_current"])();var ___cxa_increment_exception_refcount=a0=>(___cxa_increment_exception_refcount=wasmExports["__cxa_increment_exception_refcount"])(a0);var ___cxa_is_pointer_type=a0=>(___cxa_is_pointer_type=wasmExports["G"])(a0);var dynCall_jiji=Module["dynCall_jiji"]=(a0,a1,a2,a3,a4)=>(dynCall_jiji=Module["dynCall_jiji"]=wasmExports["H"])(a0,a1,a2,a3,a4);var calledRun;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller;};function run(){if(runDependencies>0){return}preRun();if(runDependencies>0){return}function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();readyPromiseResolve(Module);if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("");},1);doRun();},1);}else {doRun();}}if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()();}}run();


  return readyPromise
}
);
})();

/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let emscriptenModule;
async function init(module, moduleOptionOverrides) {
    let actualModule = module;
    let actualOptions = moduleOptionOverrides;
    // If only one argument is provided and it's not a WebAssembly.Module
    if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
        actualModule = undefined;
        actualOptions = module;
    }
    emscriptenModule = initEmscriptenModule(Module, actualModule, actualOptions);
}
async function decode(buffer, options = {}) {
    if (!emscriptenModule)
        init();
    const _options = { ...defaultDecodeOptions, ...options };
    const module = await emscriptenModule;
    const result = module.decode(buffer, _options.preserveOrientation);
    if (!result)
        throw new Error('Decoding error');
    return result;
}

"use strict";
const jpegConfig = { quality: 90, progressive: false, color_space: 2, optimize_coding: true, auto_subsample: true, baseline: true };
const convertImageToJPEG = async (image) => {
  const mimeType = image.type?.toLowerCase() || "";
  const isServiceWorker = typeof globalThis === "undefined" || !globalThis?.document;
  if (mimeType === "image/png") {
    try {
      const decoded = await decode$1(await image.arrayBuffer());
      const encoded = await encode(decoded, jpegConfig);
      return new Blob([encoded], { type: "image/jpeg" });
    } catch (pngError) {
      console.warn("[ImageProcess] PNG decoding failed:", pngError);
      if (isServiceWorker) {
        throw new Error(`PNG conversion failed and Canvas API unavailable in service worker: ${pngError}`);
      }
    }
  }
  if (isServiceWorker) {
    console.warn("[ImageProcess] Non-PNG image compression not supported in service worker, skipping compression");
    return image instanceof Blob ? image : new Blob([image], { type: mimeType });
  }
  try {
    const bitmap = await createImageBitmap(image);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }
    ctx.drawImage(bitmap, 0, 0);
    const jpegBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.9
      // 90% quality
    });
    bitmap.close();
    return jpegBlob;
  } catch (canvasError) {
    console.error("[ImageProcess] Canvas-based conversion failed:", canvasError);
    throw new Error(`Image conversion failed: ${canvasError}`);
  }
};
const removeAnyDataPrefix = (b64url) => {
  return b64url?.replace?.("data:image/png;base64,", "")?.replace?.(/data:image\/jpeg;base64,/, "");
};
const removeAnyPrefix = removeAnyDataPrefix;
const getMimeFromDataURL = (data_url) => {
  return data_url?.match?.(/data:image\/(.*);base64,/)?.[1] || "image/png";
};
const ableToShowImage = async (data_url) => {
  const bitmap = await createImageBitmap(new Blob([Uint8Array.fromBase64(removeAnyDataPrefix(data_url), { alphabet: "base64" })], { type: getMimeFromDataURL(data_url) }))?.catch?.((e) => {
    console.warn(e);
    return null;
  });
  return bitmap?.width > 0 && bitmap?.height > 0;
};
const DEFAULT_ENTITY_TYPE = "bonus";
const BASE64_PREFIX = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/;
const MAX_BASE64_SIZE = 10 * 1024 * 1024;
const deAlphaChannel = async (src) => {
  const img = new Image();
  {
    img.crossOrigin = "Anonymous";
    img.decoding = "async";
    img.src = src;
    await img.decode();
  }
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx?.fillRect(0, 0, canvas.width, canvas.height);
  ctx?.drawImage(img, 0, 0);
  const imgData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
  const arrayBuffer = await encodeWithJSquash(imgData);
  return arrayBuffer ? `data:image/jpeg;base64,${new Uint8Array(arrayBuffer)?.toBase64?.({ alphabet: "base64" })}` : null;
};
const encodeWithJSquash = async (frameData, rect) => {
  if (!frameData) return null;
  const imageDataOptions = {
    colorSpace: "srgb"
  };
  rect ??= { x: 0, y: 0, width: frameData?.width || frameData?.codedWidth || 0, height: frameData?.height || frameData?.codedHeight || 0 };
  if (frameData instanceof ImageData) {
    return encode(frameData, jpegConfig);
  } else if (frameData instanceof ImageBitmap) {
    const cnv = new OffscreenCanvas(rect.width, rect.height);
    const ctx = cnv.getContext("2d");
    ctx?.drawImage?.(frameData, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    const idata = ctx?.getImageData?.(0, 0, rect.width, rect.height, imageDataOptions);
    if (idata) return encode(idata, jpegConfig);
  } else {
    const idata = new ImageData(rect.codedWidth, rect.codedHeight, imageDataOptions);
    try {
      frameData?.copyTo?.(idata.data, { format: "RGBA", rect });
    } catch (e) {
      console.warn(e);
    }
    return encode(idata, jpegConfig);
  }
};

export { BASE64_PREFIX, DEFAULT_ENTITY_TYPE, MAX_BASE64_SIZE, ableToShowImage, convertImageToJPEG, deAlphaChannel, encodeWithJSquash, getMimeFromDataURL, jpegConfig, removeAnyDataPrefix, removeAnyPrefix };
//# sourceMappingURL=ImageProcess.js.map
