import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { CSG } from "three-csg-ts/lib/cjs/CSG.js";
//post processing imports
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
//exporters
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { DRACOExporter } from "three/examples/jsm/exporters/DRACOExporter.js";
import { NodeIO } from "@gltf-transform/core";
import {
  KHRONOS_EXTENSIONS,
  DracoMeshCompression,
} from "@gltf-transform/extensions";
import draco3d from "draco3d";
import "@google/model-viewer";
//extra imports

//********************************************************************************** */
let composer, renderPass, exporter;
let afwerkingModule;

const btnBestellen = document.getElementById("btnBestellen");

/**
 * The ID of the configuration which was created, after form submit.
 */
let configuration_id = null;

//TWEEN
var TWEEN = require("@tweenjs/tween.js");
/**
 * json data
 */
let data_module;
let data_gevel;
let data_binnen;
let data_vloer;
let data_afwerking;
let data_extra;
function fetchJsonData() {
  if (brensj_posts !== undefined) {
    data_module = JSON.parse(brensj_posts.data_mod);
    data_gevel = JSON.parse(brensj_posts.data_gev);
    data_binnen = JSON.parse(brensj_posts.data_bnn);
    data_vloer = JSON.parse(brensj_posts.data_vlr);
    data_afwerking = JSON.parse(brensj_posts.data_afw);
    data_extra = JSON.parse(brensj_posts.data_extra);
    // console.log(data_extra);
    // console.log(data_module);
  } else {
  }
}
fetchJsonData();

/**
 * Check if cookies have been changed.
 *
 * @returns {function} Closure function which checks the cookies.
 */
const checkCookies = (function () {
  // since this is a closure, lastCookies will remain the same.
  let lastCookies = document.cookie;

  return function () {
    let currentCookies = document.cookie;

    // don't do anything if the cookies haven't changed.
    if (currentCookies === lastCookies) {
      // console.log("cookies remain unchanged");
      return;
    }

    // console.log("<< COOKIES HAVE CHANGED >>");

    const cookie_value = get_cookie("configuration_id");
    const cookie_exists = cookie_value ? true : false;

    // set the configuration id, so we can send it to the server along with
    // the model and enable the submit button.
    configuration_id = cookie_exists ? cookie_value : null;
    btnBestellen.disabled = !cookie_exists;

    // make sure to update the classNames on the button so styling can be updated
    // when needed.
    const addClass = cookie_exists ? "btn-active" : "btn-disabled";
    const removeClass = cookie_exists ? "btn-disabled" : "btn-active";

    btnBestellen.classList.add(addClass);
    btnBestellen.classList.remove(removeClass);

    // console.log("<< CONFIG ID is: " + configuration_id + ">>");

    // update cookies.
    lastCookies = currentCookies;

    // console.log("<< COOKIES ARE NOW: " + lastCookies + " >>");
  };
})(); // execute immediately.

// check the cookies every half second.
window.setInterval(checkCookies, 500);

/**
 * Get the value of a cookie.
 */
function get_cookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }

  return "";
}
const path = `${window.location}wp-content/themes/flux-child/configurator/`;
// const path = "";
/**
 * loadingmanager
 */
const loadingbartext = document.querySelector(".loader-text");
const loadingManager = new THREE.LoadingManager(
  () => {
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.classList.add("fade-out");

    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener("transitionend", onTransitionEnd);
  },
  (itemUrl, itemsLoaded, itemsTotal) => {
    // console.log(itemsLoaded + " / " + itemsTotal);
    // const progressRatio = itemsLoaded / itemsTotal;
    const progressRatio = itemsLoaded / 28;
    loadingbartext.innerHTML = Math.floor(progressRatio * 100) + "%";
  }
);
function onTransitionEnd(event) {
  event.target.remove();
}
/**
 * Loaders
 */
const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath(path + "/draco/");
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);
const textureLoader = new THREE.TextureLoader(loadingManager);
/**
 * Base
 */
// Debug
const gui = new dat.GUI();
gui.hide();
const debugObject = {};
// Canvas
const canvas = document.querySelector("canvas.webgl");
// Scene
const scene = new THREE.Scene();
/**
 * matrials
 */
//environement
//grass
const colorTextureGrass = textureLoader.load(
  path + "./textures/environment/grass/grass.jpg"
);
const normalTextureGrass = textureLoader.load(
  path + "./textures/environment/grass/NormalMap.jpg"
);
colorTextureGrass.wrapS =
  colorTextureGrass.wrapT =
  normalTextureGrass.wrapS =
  normalTextureGrass.wrapT =
    THREE.RepeatWrapping;
colorTextureGrass.repeat = normalTextureGrass.repeat.set(15, 15);
const grassMaterial = new THREE.MeshStandardMaterial({
  map: colorTextureGrass,
  normalMap: normalTextureGrass,
});
//binnenafwerking
//kerto
let kerto;
//gyproc
const gyproc = new THREE.MeshStandardMaterial({
  color: 0xfbfbfb,
  name: "gyproc",
});
//vloerafwerking
//vinyl
let vinyl;
//chippswood
const chippsColor = textureLoader.load(
  path + "./textures/vloerafwerking/chippswood/Chipps_2.jpg"
);
const chippsNormal = textureLoader.load(
  path + "./textures/vloerafwerking/chippswood/Chipps_2_norm.jpg"
);
chippsColor.wrapS =
  chippsColor.wrapT =
  chippsNormal.wrapS =
  chippsNormal.wrapT =
    THREE.RepeatWrapping;
// chippsNormal.repeat = chippsColor.repeat.set(3, 3);
const chippswoodMaterial = new THREE.MeshStandardMaterial({
  map: chippsColor,
  normalMap: chippsNormal,
});
chippswoodMaterial.name = "chippswood";
/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};
/*********************************************************************************************************************
 * export gltf
 */
btnBestellen.addEventListener("click", (e) => {
  // only export the model if a configuration id was set.
  if (!configuration_id) {
    return;
  }
  // disable the button, so we can't submit multiple times.
  e.target.classList.remove("btn-active");
  e.target.classList.add("btn-disabled");
  // get the model which will be exported and export the scene to a GLB.
  const brensj = scene.getObjectByName("modulegroup");
  toGLTF(brensj);
});
/**
 * Submit the form.
 * @param {ArrayBuffer} data The exported data.
 */
let pdfcanvas = document.createElement("canvas");
const submit = (data) => {
  // create a new FormData object, which will be used to send the data to the
  // server.
  exportImg(data);
};
function exportImg(data) {
  //screenshot1 hoofdshot
  floor.material.visible = false;
  sky.material.visible = false;
  camera.zoom = 2;
  camera.position.set(
    cameraPosities[0].x,
    cameraPosities[0].y,
    cameraPosities[0].z
  );
  camera.lookAt(fcsObj.position);
  camera.aspect = 690 / 351;
  camera.updateProjectionMatrix();
  renderer.setSize(690, 351);
  renderer.render(scene, camera);
  let imgURL = renderer.domElement.toDataURL("image/jpeg", 1.0);
  // floor.visible = true;
  // sky.visible = true;
  const formData = new FormData();
  formData.append("model", data);
  formData.append("configuration_id", configuration_id);
  formData.append("action", "brensj_upload_model");
  formData.append("image", imgURL);

  //screenshot2
  if (cameras.length > 0) {
    camera.zoom = 1;
    floor.material.visible = true;
    sky.material.visible = true;
    for (let i = 0; i < cameras.length + 1; i++) {
      camera.position.set(
        cameraPosities[i].x,
        cameraPosities[i].y,
        cameraPosities[i].z
      );
      if (i !== 0) {
        camera.lookAt(new THREE.Vector3(0, 1.5, cameraPosities[i].z + 1.25));
      }
      // camera.lookAt(new THREE.Vector3(cameraPosities[i].x-0.1,cameraPosities[i].y-0.1,cameraPosities[i].z-0.1));
      camera.aspect = 700 / 500;
      camera.updateProjectionMatrix();
      renderer.setSize(700, 500);
      renderer.render(scene, camera);
      const imgURL1 = renderer.domElement.toDataURL("image/jpeg", 1.0);
      formData.append("image" + i, imgURL1);
    }
  }

  // formData.append("image", imgURL1);
  // build options.
  const options = {
    type: "POST",
    url: ajax.url,
    contentType: false,
    processData: false,
    data: formData,
    error: (err) => {
      console.log("Something went wrong uploading the exported data.");
      console.error(err);

      // something went wrong, re-enable the button.
      btnBestellen.classList.add("btn-active");
      btnBestellen.classList.remove("btn-disabled");
    },
    success: (response) => {
      // console.log(response);

      // redirect user to pdf view.
      const redirect_to = `${window.location}offerte/?configuration_id=${configuration_id}`;
      window.open(redirect_to, "_blank") || window.location.assign(redirect_to);
    },
  };

  // perform request.
  jQuery.ajax(options);
  uiHide();
  setTimeout(() => {
    showEnvironment();
  }, 1000);
}
function showEnvironment(){
  floor.material.visible = true;
  sky.material.visible = true;
  camera.zoom = 1;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.render(scene, camera);
}
function loadImage(img0) {
  return new Promise((resolve, reject) => {
    img0.onload = function () {
      resolve();
    };
  });
}
/**
 * Export the scene to a GLTF.
 * @param {THREE.Object3D} model The model to export.
 */
const toGLTF = (model) => {
  const exporter = new GLTFExporter();
  const options = {
    trs: false,
    onlyVisible: true,
    truncateDrawRange: true,
    binary: true,
    forceIndices: true,
    maxTextureSize: 1024 || Infinity, // to prevent NaN value
  };

  exporter.parse(
    model,
    (result) => {
      // compress the resulting arrayBuffer before saving.
      dracoCompress(result);
    },
    options
  );
};

/**
 * export draco compression
 */
async function dracoCompress(arrayBuffer) {
  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });

  const document = io.readBinary(arrayBuffer); // read GLB from ArrayBuffer
  document
    .createExtension(DracoMeshCompression)
    .setRequired(true)
    .setEncoderOptions({
      method: DracoMeshCompression.EncoderMethod.EDGEBREAKER,
      encodeSpeed: 5,
    });

  const compressedArrayBuffer = io.writeBinary(document); // write GLB to ArrayBuffer
  const blob = new Blob([compressedArrayBuffer], {
    type: "application/octet-stream",
  });

  // submit data to backend.
  submit(blob);
}

/***********************************************************************************************************************************
 * Models
 */
//module
let bbox;
let module;
let bboxLength;
let bboxHeight;
gltfLoader.load(path + "./models/brensjtest1.glb", (gltf) => {
  module = gltf.scene;
  // console.log(module);
  bbox = new THREE.Box3().setFromObject(module);
  bboxLength = bbox.max.z - bbox.min.z;
  bboxHeight = bbox.max.y - bbox.min.y;
  init();
});
//floor
const floor = new THREE.Mesh(new THREE.CircleGeometry(100, 50), grassMaterial);
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = 0;
floor.material.receiveShadow = true;
scene.add(floor);
/**
 * Lights
 */
//ambient
const light = new THREE.AmbientLight(0x404040, 1); // soft light
scene.add(light);
//hemisphere light
const hemilight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
scene.add(hemilight);
//directional
const directionalLight = new THREE.DirectionalLight("#ffffff", 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 25;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.normalBias = 0.03;
directionalLight.position.set(1.5, 3, -2.5);
scene.add(directionalLight);
gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("lightIntensity");
gui
  .add(directionalLight.position, "x")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightX");
gui
  .add(directionalLight.position, "y")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightY");
gui
  .add(directionalLight.position, "z")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightZ");
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const iface = document.querySelectorAll(".interface-container");
const bottomCanvasText = document.getElementById("bottomCanvasText");
// scherm halveren bij ui hide
const uiHide = () => {
  if (iface[0].classList.contains("hidden")) {
    sizes.width = window.innerWidth;
    bottomCanvasText.style.right = "35%";
  } else {
    sizes.width = window.innerWidth / 2;
    bottomCanvasText.style.right = "10%";
  }
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
};
//resizer
window.addEventListener("resize", () => {
  // Update sizes
  uiHide();
  // sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
  //post processing
  // composer.setSize( width, height );
});
/**
 * Camera
 */
// Base camera
let fov = 50;
let ratio = sizes.width / sizes.height;
let near = 0.1;
let far = 150;
const camera = new THREE.PerspectiveCamera(fov, ratio, near, far);
camera.position.set(-3, 3, -8);
scene.add(camera);
// Controls
//orbit
const lerpParams = {
  lerpAlpha: 0.1,
};
let camTarget = new THREE.Vector3(0, 1.5, 1);
const fcsObj = new THREE.Object3D();
fcsObj.position.set(camTarget.x, camTarget.y, camTarget.z);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(camTarget.x, camTarget.y, camTarget.z);

controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 1.95;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
renderer.setClearColor(0xffffff);
gui
  .add(renderer, "toneMapping", {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  })
  .onFinishChange(() => {
    renderer.toneMapping = Number(renderer.toneMapping);
    updateAllMaterials();
  });
gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001);
/**
 * post-processing
 */
composer = new EffectComposer(renderer);
renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
//  saoPass = new SAOPass( scene, camera, false, true );
//  composer.addPass( saoPass );
/**
 * Animate
 */
const tick = () => {
  //orbitcamera follows target
  if (camTarget !== undefined && fcsObj !== undefined) {
    // Update controls
    controls.update();
    controls.target.copy(fcsObj.position);
    fcsObj.position.lerp(camTarget, lerpParams.lerpAlpha);
  }
  // Render
  renderer.render(scene, camera);
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
  //tween animation
  TWEEN.update();
};
tick();
/**
 * material set
 */
const setMaterial = (string, msh) => {
  let mat = string.substring(0, 3);
  if (msh === "binnen") {
    switch (mat) {
      case "gyp":
        brensjParams.binnenMateriaal = gyproc;
        break;
      case "ker":
        brensjParams.binnenMateriaal = kerto;
        break;
    }
  } else if (msh === "gevel") {
    switch (mat) {
      case "equ":
        brensjParams.gevel = "equitone";
        brensjParams.back = "bequitone";
        break;
      case "lei":
        brensjParams.gevel = "leien";
        brensjParams.back = "bleien";
        break;
      case "the":
        brensjParams.gevel = "thermowood";
        brensjParams.back = "bthermowood";
        break;
      case "zin":
        brensjParams.gevel = "zink";
        brensjParams.back = "bzink";
        break;
    }
  } else if (msh === "vloer") {
    switch (mat) {
      case "chi":
        brensjParams.vloerMateriaal = chippswoodMaterial;
        break;
      case "ker":
        brensjParams.vloerMateriaal = kerto;
        break;
      case "vin":
        brensjParams.vloerMateriaal = vinyl;
        break;
    }
  }
  setWork();
};
const afwerkingsNiveau = () => {
  let m1;
  let m2;
  let m3;
  if (brensjParams.afwerking === "cosy") {
    m1 = bruinMeub;
    m2 = witMeub;
    m3 = quartz;
  } else if (brensjParams.afwerking === "premium") {
    m1 = bruinMeub;
    m2 = bruinMeub;
    m3 = zwartMeub;
  } else if (brensjParams.afwerking === "high-end") {
    m1 = zwartMeub;
    m2 = zwartMeub;
    m3 = quartz;
  }
  // loadFile();
  createBulletinP();
  //kast
  meubilair["kast1_meub"].children[0].material = m1;
  meubilair["kast1_meub"].children[1].material = m2;
  meubilair["kast1_meub"].children[2].material = m3;
  //kast2
  meubilair["kast2_meub"].children[0].material = m1;
  meubilair["kast2_meub"].children[1].material = m2;
  meubilair["kast2_meub"].children[2].material = m3;
  //kast3
  meubilair["kast3_meub"].children[0].material = m1;
  meubilair["kast3_meub"].children[1].material = m3;
  //kast5
  meubilair["kast5_meub"].children[0].material = m1;
  meubilair["kast5_meub"].children[1].material = m2;
  meubilair["kast5_meub"].children[2].material = m3;
  if (brensjParams.afwerking === "cosy") {
    ////kast6
    meubilair["kast6_meub"].children[0].material = meubilair[
      "kast6_meub_nr"
    ].children[0].material = bruinMeub;
    meubilair["kast6_meub"].children[1].material = meubilair[
      "kast6_meub_nr"
    ].children[1].material = bruinMeub;
    meubilair["kast6_meub"].children[2].material = meubilair[
      "kast6_meub_nr"
    ].children[2].material = witMeub;
    meubilair["kast6_meub"].children[3].material = meubilair[
      "kast6_meub_nr"
    ].children[3].material = witMeub;
    meubilair["kast6_meub_up_2"].children[0].material = bruinMeub;
    meubilair["kast6_meub_up_2"].children[1].material = witMeub;
    //kast 4
    meubilair["kast4_meub"].children[0].material =
      meubilair["kast4_meub_2"].children[0].material =
      meubilair["kast4_meub_1"].children[0].material =
      meubilair["kast4_meub_2_1"].children[0].material =
      meubilair["kast4_meub_laden"].children[0].material =
      meubilair["kast4_meub_1_laden"].children[0].material =
      meubilair["kast4_meub_2_laden"].children[0].material =
      meubilair["kast4_meub_2_1_laden"].children[0].material =
        bruinMeub;
    meubilair["kast4_meub"].children[1].material =
      meubilair["kast4_meub_2"].children[1].material =
      meubilair["kast4_meub_1"].children[1].material =
      meubilair["kast4_meub_2_1"].children[1].material =
        bruinMeub;
    meubilair["kast4_meub_laden"].children[1].material =
      meubilair["kast4_meub_2_laden"].children[1].material =
      meubilair["kast4_meub_1_laden"].children[1].material =
      meubilair["kast4_meub_2_1_laden"].children[1].material =
        witMeub;
    //kast8 en 3
    meubilair["kast8_meub"].children[0].material = witMeub;
    meubilair["kast8_meub"].children[1].material = zwartMeub;
    meubilair["kast3_meub"].children[0].material = bruinMeub;
    meubilair["kast3_meub"].children[1].material = witMeub;
    //wasmachine
    meubilair["wasmachine1_meub"].children[1].material = bruinMeub;
    //toilet
    meubilair["toilet_meub"].children[0].material = witMeub;
    // meubilair["toilet_meub"].children[2].material = witMeub;
    meubilair["toilet_meub"].children[1].material = zwartMeub;
    //wasbak
    meubilair["wasbak1_meub_nr"].children[2].material = m1;
  } else if (brensjParams.afwerking === "premium") {
    ////kast6
    meubilair["kast6_meub"].children[0].material = meubilair[
      "kast6_meub_nr"
    ].children[0].material = grijsMeub;
    meubilair["kast6_meub"].children[1].material = meubilair[
      "kast6_meub_nr"
    ].children[1].material = granietZwart;
    meubilair["kast6_meub"].children[2].material = meubilair[
      "kast6_meub_nr"
    ].children[2].material = witMeub;
    meubilair["kast6_meub"].children[3].material = meubilair[
      "kast6_meub_nr"
    ].children[3].material = zwartMeub;
    meubilair["kast6_meub_up_2"].children[0].material = grijsMeub;
    meubilair["kast6_meub_up_2"].children[1].material = witMeub;
    //kast 4
    meubilair["kast4_meub"].children[0].material =
      meubilair["kast4_meub_2"].children[0].material =
      meubilair["kast4_meub_1"].children[0].material =
      meubilair["kast4_meub_2_1"].children[0].material =
      meubilair["kast4_meub_laden"].children[0].material =
      meubilair["kast4_meub_1_laden"].children[0].material =
      meubilair["kast4_meub_2_laden"].children[0].material =
      meubilair["kast4_meub_2_1_laden"].children[0].material =
        grijsMeub;
    meubilair["kast4_meub"].children[1].material =
      meubilair["kast4_meub_2"].children[1].material =
      meubilair["kast4_meub_1"].children[1].material =
      meubilair["kast4_meub_2_1"].children[1].material =
        granietZwart;
    meubilair["kast4_meub_laden"].children[1].material =
      meubilair["kast4_meub_2_laden"].children[1].material =
      meubilair["kast4_meub_1_laden"].children[1].material =
      meubilair["kast4_meub_2_1_laden"].children[1].material =
        zwartMeub;
    //kast8 en 3
    meubilair["kast8_meub"].children[0].material = witMeub;
    meubilair["kast8_meub"].children[1].material = zwartMeub;
    meubilair["kast3_meub"].children[0].material = grijsMeub;
    meubilair["kast3_meub"].children[1].material = zwartMeub;
    //wasmachine
    meubilair["wasmachine1_meub"].children[1].material = granietZwart;
    //toilet
    meubilair["toilet_meub"].children[0].material = witMeub;
    // meubilair["toilet_meub"].children[2].material = witMeub;
    meubilair["toilet_meub"].children[1].material = zwartMeub;
    //wasbak
    meubilair["wasbak1_meub_nr"].children[2].material = grijsMeub;
  } else if (brensjParams.afwerking === "high-end") {
    ////kast6
    meubilair["kast6_meub"].children[0].material = meubilair[
      "kast6_meub_nr"
    ].children[0].material = grijsMeub;
    meubilair["kast6_meub"].children[1].material = meubilair[
      "kast6_meub_nr"
    ].children[1].material = witMeub;
    meubilair["kast6_meub"].children[2].material = meubilair[
      "kast6_meub_nr"
    ].children[2].material = grijsMeub;
    meubilair["kast6_meub"].children[3].material = meubilair[
      "kast6_meub_nr"
    ].children[3].material = zwartMeub;
    //kast 4
    meubilair["kast4_meub"].children[0].material =
      meubilair["kast4_meub_2"].children[0].material =
      meubilair["kast4_meub_1"].children[0].material =
      meubilair["kast4_meub_2_1"].children[0].material =
      meubilair["kast4_meub_laden"].children[0].material =
      meubilair["kast4_meub_1_laden"].children[0].material =
      meubilair["kast4_meub_2_laden"].children[0].material =
      meubilair["kast4_meub_2_1_laden"].children[0].material =
        bruinMeub;
    meubilair["kast4_meub"].children[1].material =
      meubilair["kast4_meub_2"].children[1].material =
      meubilair["kast4_meub_1"].children[1].material =
      meubilair["kast4_meub_2_1"].children[1].material =
        witMeub;
    meubilair["kast4_meub_laden"].children[1].material =
      meubilair["kast4_meub_2_laden"].children[1].material =
      meubilair["kast4_meub_1_laden"].children[1].material =
      meubilair["kast4_meub_2_1_laden"].children[1].material =
        zwartMeub;
    //kast8 en 3
    meubilair["kast8_meub"].children[0].material = grijsMeub;
    meubilair["kast8_meub"].children[1].material = zwartMeub;
    meubilair["kast3_meub"].children[0].material = grijsMeub;
    meubilair["kast3_meub"].children[1].material = zwartMeub;
    //wasmachine
    meubilair["wasmachine1_meub"].children[1].material = witMeub;
    //toilet
    meubilair["toilet_meub"].children[0].material = witMeub;
    // meubilair["toilet_meub"].children[2].material = grijsMeub;
    meubilair["toilet_meub"].children[1].material = zwartMeub;
    //wasbak
    meubilair["wasbak1_meub_nr"].children[2].material = bruinMeub;
  }
  // meubilair["kast6_meub_nr"].children[2].material = m3;
  //kast6_4
  meubilair["kast6_meub_4"].children[0].material = m1;
  meubilair["kast6_meub_4"].children[1].material = m2;
  meubilair["kast6_meub_4"].children[2].material = m3;
  //kast6_4 nr
  meubilair["kast6_meub_nr_4"].children[0].material = m1;
  meubilair["kast6_meub_nr_4"].children[1].material = m2;
  meubilair["kast6_meub_nr_4"].children[2].material = m3;
  //eetmeub
  meubilair["eet1_meub"].children[0].material = m1;
  meubilair["eet1_meub"].children[1].material = m3;
  //work meub
  meubilair["work1_meub"].children[0].material = m1;
  meubilair["work1_meub"].children[1].material = m2;
  if (brensjParams.afwerking === "cosy") {
    meubilair["work1_meub"].children[2].material = m1;
  } else {
    meubilair["work1_meub"].children[2].material = m3;
  }
  //
  setWork();
};
/***************************************************************file load************************************************** */
//externe informatie document uitlezen
const step4Container = document.getElementById("step4");
// const loadFile = () => {
//   THREE.Cache.enabled = true;
//   const fileLoader = new THREE.FileLoader();
//   const file = fileLoader.load(
//     path + "info/" + brensjParams.work + "-" + brensjParams.afwerking + ".txt",
//     function (data) {
//       createBulletinPoints(data);
//     }
//   );
// };
//leest document en creert afwerking bulletin points
let bulletinBoard;
let bulletinTitle;
let bulletinList;
// const createBulletinPoints = (filereader) => {
//   //remove previous bulletinpoints
//   if (bulletinBoard !== undefined) {
//     bulletinBoard.remove();
//   }
//   // //remove all children in list
//   // if (bulletinList !== undefined) {
//   //   if (bulletinList.hasChildNodes()) {
//   //     const array = bulletinList.childNodes;
//   //     for (let i = 0; i < bulletinList.childNodes.length; i++) {
//   //       bulletinList.removeChild( bulletinList.childNodes[i])
//   //     }
//   //   }
//   // }
//   //line by line
//   // var lines = filereader.result.split("\n");
//   bulletinBoard = document.createElement("div");
//   step4Container.appendChild(bulletinBoard);
//   var lines = filereader.split("\n");
//   for (var line = 0; line < lines.length; line++) {
//     if (line === 0) {
//       bulletinTitle = document.createElement("h3");
//       bulletinTitle.id = "bulletinTitle";
//       bulletinTitle.innerHTML = lines[line];
//       bulletinBoard.appendChild(bulletinTitle);
//       bulletinList = document.createElement("ul");
//       bulletinList.id = "bulletinList";
//       bulletinBoard.appendChild(bulletinList);
//     } else {
//       if (lines[line] !== "") {
//         const li = document.createElement("li");
//         li.innerHTML = lines[line];
//         bulletinList.appendChild(li);
//       }
//     }
//   }
// };
const createBulletinP = () => {
  if (bulletinBoard !== undefined) {
    bulletinBoard.remove();
  }
  bulletinBoard = document.createElement("div");
  step4Container.appendChild(bulletinBoard);
  if (afwerkingText !== undefined) {
    bulletinTitle = document.createElement("h3");
    bulletinTitle.id = "bulletinTitle";
    bulletinTitle.innerHTML = brensjParams.afwerking;
    bulletinBoard.appendChild(bulletinTitle);
    bulletinList = document.createElement("div");
    bulletinList.id = "bulletinList";
    bulletinList.innerHTML = afwerkingText;
    bulletinBoard.appendChild(bulletinList);
  }
};
/*********************************************brensj params ********************************************************/
//brensj parameters
const brensjParams = {
  work: "work-1",
  modules: 1,
  gevel: "leien",
  binnenMateriaal: kerto,
  vloerMateriaal: chippswoodMaterial,
  front: "fwindow1",
  back: "bleien",
  afwerking: "cosy",
  camPos: 0,
  moduleID: 1951,
  inbetweenSpace: 5.95,
};
/**
 * module init
 */
let moduleGroup = [];
let gevelAfwerking = {};
let binnenAfwerking = {};
let vloeren = {};
let frameOpvulling = {};
let meubilair = {};
let frames = {};
let side = {};
let lights = {};
let verwarming = {};
let electronica = {};
let plugs = {};
let bool;
let kot;
//materiaal
let zwartMeub, bruinMeub, granietZwart, grijsMeub, witMeub;
let quartz;
const init = () => {
  for (const child of module.children) {
    switch (child.name) {
      //frame opvulling
      case "framewindow":
        frameOpvulling["fwindow1"] = child;
        break;
      case "framewindow2":
        frameOpvulling["fwindow2"] = child;
        break;
      case "backwall":
        frameOpvulling["bwall"] = child;
        break;
      case "Equitone_back":
        frameOpvulling["bequitone"] = child;
        break;
      case "leien_back":
        frameOpvulling["bleien"] = child;
        break;
      case "thermowood_back":
        frameOpvulling["bthermowood"] = child;
        break;
      case "zink_back":
        frameOpvulling["bzink"] = child;
        break;
      //tussenscheiding
      case "frametussenscheiding1":
        frameOpvulling["fframetussenscheiding1"] = child;
        break;
      case "frametussenscheiding1_2":
        frameOpvulling["fframetussenscheiding1_2"] = child;
        break;
      case "frametussenscheiding1_ceiling":
        frameOpvulling["fframetussenscheiding1_ceiling"] = child;
        break;
      case "frametussenscheiding2":
        frameOpvulling["fframetussenscheiding2"] = child;
        break;
      case "frametussenscheiding3":
        frameOpvulling["fframetussenscheiding3"] = child;
        break;
      //frames
      case "frame":
        frames["front"] = child;
        break;
      case "frameback":
        frames["back"] = child;
        break;
      //gevelafwerking
      case "Equitone":
        gevelAfwerking["equitone"] = child;
        break;
      case "leien":
        gevelAfwerking["leien"] = child;
        break;
      case "thermowood":
        gevelAfwerking["thermowood"] = child;
        break;
      case "zink":
        gevelAfwerking["zink"] = child;
        break;
      //binnenafwerking
      case "binnengevel":
        kerto = child.material.clone();
        binnenAfwerking["binnengevel"] = child;
        break;
      case "binnengevel_back":
        binnenAfwerking["binnengevel_back"] = child;
        break;
      case "binnengevelrand":
        binnenAfwerking["binnengevelrand"] = child;
        break;
      //vloeren
      case "floor":
        vinyl = child.material.clone();
        vinyl.name = "vinyl";
        vloeren["vloer"] = child;
        break;
      //meubilair
      case "work1_Meubilair":
        meubilair["work1_meub"] = child;
        break;
      case "kast1_Meubilair":
        meubilair["kast1_meub"] = child;
        zwartMeub = child.children[0].material;
        witMeub = child.children[1].material;
        quartz = child.children[2].material;
        break;
      case "kast2_Meubilair":
        meubilair["kast2_meub"] = child;
        break;
      case "kast3_Meubilair":
        meubilair["kast3_meub"] = child;
        break;
      case "kast4_Meubilair":
        meubilair["kast4_meub"] = child;
        break;
      case "kast4_Meubilair_laden":
        meubilair["kast4_meub_laden"] = child;
        break;
      case "kast4_Meubilair_2":
        meubilair["kast4_meub_2"] = child;
        break;
      case "kast4_Meubilair_2_laden":
        meubilair["kast4_meub_2_laden"] = child;
        break;
      case "kast4_Meubilair_1":
        meubilair["kast4_meub_1"] = child;
        break;
      case "kast4_Meubilair_1_laden":
        meubilair["kast4_meub_1_laden"] = child;
        break;
      case "kast4_Meubilair_2_1":
        meubilair["kast4_meub_2_1"] = child;
        break;
      case "kast4_Meubilair_2_1_laden":
        meubilair["kast4_meub_2_1_laden"] = child;
        break;
      case "kast5_Meubilair":
        meubilair["kast5_meub"] = child;
        break;
      case "kast6_Meubilair":
        meubilair["kast6_meub"] = child;
        grijsMeub = child.children[0].material;
        granietZwart = child.children[1].material;
        break;
      case "kast6_Meubilair_4":
        meubilair["kast6_meub_4"] = child;
        break;
      case "kast6_Meubilair_NR":
        meubilair["kast6_meub_nr"] = child;
        break;
      case "kast6_Meubilair_up":
        meubilair["kast6_meub_up"] = child;
        break;
      case "kast6_Meubilair_up_2":
        meubilair["kast6_meub_up_2"] = child;
        break;
      case "kast6_Meubilair_up_4":
        meubilair["kast6_meub_up_4"] = child;
        break;
      case "kast6_Meubilair_NR_4":
        meubilair["kast6_meub_nr_4"] = child;
        break;
      case "kast8_Meubilair":
        meubilair["kast8_meub"] = child;
        break;
      case "wasbak1_Meubilair":
        meubilair["wasbak1_meub"] = child;
        break;
      case "wasbak1_Meubilair_NR":
        meubilair["wasbak1_meub_nr"] = child;
        break;
      case "wasmachine1_Meubilair":
        meubilair["wasmachine1_meub"] = child;
        break;
      case "bed1_Meubilair":
        meubilair["bed1_meub"] = child;
        break;
      case "bed1_Meubilair_matras":
        meubilair["bed1_meub_matras"] = child;
        break;
      case "bed2_Meubilair":
        child.position.z += 2.5;
        meubilair["bed2_meub"] = child;
        break;
      case "bed2_Meubilair_matras":
        child.position.z += 2.5;
        meubilair["bed2_meub_matras"] = child;
        break;
      case "toilet_Meubilair":
        meubilair["toilet_meub"] = child;
        break;
      case "douche_Meubilair":
        child.children[1].material = new THREE.MeshPhysicalMaterial({
          color: "rgb(70%, 90%, 100%)",
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        meubilair["douche_meub"] = child;
        break;
      case "tafel1":
        meubilair["tafel1"] = child;
        bruinMeub = child.children[0].material;
        break;
      case "tafel2":
        meubilair["tafel2"] = child;
        break;
      case "tafel2":
        meubilair["tafel2"] = child;
        break;
      case "tafel3":
        meubilair["tafel3"] = child;
        break;
      case "tafel4":
        meubilair["tafel4"] = child;
        break;
      case "eetaanrecht1_Meubilair":
        meubilair["eet1_meub"] = child;
        break;
      case "zetel1":
        meubilair["zetel1_meub"] = child;
        break;
      case "zetel1_1":
        meubilair["zetel1_1_meub"] = child;
        break;
      //side module
      case "sWindow1":
        side["swindow1"] = child;
        break;
      case "bool":
        bool = child;
        break;
      case "kot1":
        kot = child;
        break;
      //lights
      case "light1":
        lights["light1"] = child;
        break;
      case "light2":
        lights["light2"] = child;
        break;
      //verwarming
      case "verwarming_cosy":
        verwarming["verwarming_cosy"] = child;
        break;
      case "verwarming_premium":
        verwarming["verwarming_premium"] = child;
        break;
      case "verwarming_cosy_left":
        verwarming["verwarming_cosy_left"] = child;
        break;
      case "verwarming_premium_left":
        verwarming["verwarming_premium_left"] = child;
        break;
      //electronica
      case "monitor1_Meubilair":
        electronica["monitor1"] = child;
        break;
      case "tablet1_Meubilair":
        electronica["tablet1"] = child;
        break;
      //plugs
      case "plug1_back":
        plugs["back"] = child;
        break;
      case "plug1_right":
        plugs["right"] = child;
        break;
    }
  }
  moduleGroup = new THREE.Group();
  moduleGroup.name = "modulegroup";
  brensjParams.binnenMateriaal = kerto;
  brensjParams.vloerMateriaal = kerto;
  uiHide();
  afwerkingsNiveau();
  // extraOptions();
};
//modules bouwen
const aantalModules = (aantal, gA, bA, vA, fO, bO) => {
  if (aantal > 1) {
    for (let i = 0; i < aantal; i++) {
      if (i === 0) {
        buildModule(gA, bA, vA, fO, bO, "front", 0);
      } else if (i === aantal - 1) {
        buildModule(gA, bA, vA, fO, bO, "back", i);
      } else {
        buildModule(gA, bA, vA, fO, bO, "none", i);
      }
    }
  } else {
    buildModule(gA, bA, vA, fO, bO, "both", 0);
  }
  //
  moduleGroup.scale.set(0.1, 0.1, 0.1);
  moduleGroup.rotation.y = Math.PI;
  changeMaterial(
    moduleGroup,
    brensjParams.binnenMateriaal,
    brensjParams.vloerMateriaal
  );
  //laatste module van live brensj is wit
  if (brensjParams.work.substring(0, 4) === "live") {
    changeMaterial(
      moduleGroup.children[moduleGroup.children.length - 1],
      gyproc,
      brensjParams.vloerMateriaal
    );
  }
  scene.add(moduleGroup);
};
const buildModule = (gmA, bmA, vmA, fmO, bmO, frm, nmbr) => {
  const mModule = new THREE.Group();
  //gevel afwerking
  const gvl = gevelAfwerking[gmA].clone();
  // mModule.add(gvl);
  //binnenafwerking
  const bnnn = binnenAfwerking[bmA].clone();
  // mModule.add(bnnn);
  //vloer
  mModule.add(vloeren[vmA].clone());
  //content in module
  works(mModule, gvl, bnnn, nmbr);
  //frame
  if (frm === "front") {
    mModule.add(frames[frm].clone());
    muurOpvullling(fmO, "", mModule);
  } else if (frm === "back") {
    mModule.add(frames[frm].clone());
    muurOpvullling("", bmO, mModule);
  } else if (frm === "both") {
    mModule.add(frames["back"].clone());
    mModule.add(frames["front"].clone());
    muurOpvullling(fmO, "", mModule);
    muurOpvullling("", bmO, mModule);
    // mModule.add(frameOpvulling[fmO].clone());
    // mModule.add(frameOpvulling[bmO].clone());
  }
  //add lights on ceiling
  if (
    brensjParams.work.substring(0, 4) === "live" &&
    nmbr + 1 === brensjParams.modules
  ) {
  } else {
    if (brensjParams.afwerking === "cosy") {
      mModule.add(lights["light2"].clone());
    } else {
      mModule.add(lights["light1"].clone());
    }
    const pLight = new THREE.PointLight("#ffffff", 1, 10);
    const pLight1 = new THREE.PointLight("#ffffff", 1, 10);
    pLight.position.set(0, 29, -20);
    pLight1.position.set(0, 29, -10);
    mModule.add(pLight, pLight1);
  }

  //add to main group
  mModule.position.z =
    (-bboxLength /*/ 2 + 3.75*/ + brensjParams.inbetweenSpace) * nmbr;
  mModule.name = "module" + nmbr;
  cameraPosities[nmbr + 1] = new THREE.Vector3(
    (mModule.position.x - 5) * 0.1,
    (mModule.position.y + 20) * 0.1,
    (-mModule.position.z + 5) * 0.1
  );
  // createCamera(cameraPosities[nmbr + 1],mModule.position);
  addCameraButton(nmbr + 1);
  moduleGroup.add(mModule);
  // console.log(moduleGroup);
};

const muurOpvullling = (fmO, bmO, mModule) => {
  let results = [];
  let wall = binnenAfwerking["binnengevel_back"].clone();
  if (fmO !== "") {
    if (fmO.substring(0, 1) !== "f") {
      const front = frameOpvulling[fmO].clone();
      front.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
      front.position.z = -bbox.max.z + 5;
      mModule.add(front);
      //binnenmuur toevoegen als muur afgesloten is
      if (fmO.substring(1, 4) !== "win") {
        wall.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
        wall.position.z = -bbox.max.z;
        mModule.add(wall);
      }
    } else {
      mModule.add(frameOpvulling[fmO].clone());
    }
  }
  if (bmO !== "") {
    let backOpvulling = frameOpvulling[bmO].clone();
    if (bmO.substring(0, 1) !== "f") {
      if (
        brensjParams.work === "live-care-3" ||
        brensjParams.work === "live-care-4" ||
        brensjParams.work === "live-care-3-rv" ||
        brensjParams.work === "live-care-4-rv"
      ) {
        //raam toevoegen op achterste muur bij wonen 3
        const model = side["swindow1"].clone();
        results = cutOutWalls(model, wall, backOpvulling, mModule, 7);
        wall = results[0];
        backOpvulling = results[1];
      }

      if (bmO.substring(1, 4) !== "win") {
        mModule.add(wall);
        mModule.add(backOpvulling);
      }
    } else {
      const back = frameOpvulling[bmO].clone();
      back.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
      back.position.z = bbox.min.z + 4;
      mModule.add(back);
    }
  }
};
const changeMaterial = (group, binnen, vloer) => {
  group.traverse(function (child) {
    if (child instanceof THREE.Object3D) {
      if (
        child.name === "binnengevel" ||
        child.name === "binnengevel_back" ||
        child.name === "frametussenscheiding3" ||
        child.name === "frametussenscheiding2" ||
        child.name === "frametussenscheiding1" ||
        child.name === "frametussenscheiding1_ceiling" ||
        child.name === "kast6_Meubilair_up" ||
        child.name === "kast6_Meubilair_up_4"
      ) {
        child.material = binnen;
      } else if (child.name === "floor") {
        child.material = vloer;
      } else if (child.name === "kot1") {
        child.children[0].material = binnen;
      } else if (child.name === "frametussenscheiding1_2") {
        child.children[0].material = brensjParams.binnenMateriaal;
        child.children[1].material = binnen;
      }
    }
  });
  // updateAllMaterials();
  // shadowsToMesh(moduleGroup);
};
/**
 * set works content
 */
const works = (mdlgrp, gvl, bnnn, mdlnmbr) => {
  let result = gvl;
  let result1 = bnnn;
  let results = [];
  const sidemodel = side["swindow1"].clone();
  //work modules
  if (brensjParams.work.substring(0, 4) === "work") {
    if (brensjParams.work === "work-1") {
      afwerkingModule = "work-1";
      //work1
      mdlgrp.add(meubilair["work1_meub"].clone());
      mdlgrp.add(plugs["back"].clone());
      mdlgrp.add(plugs["right"].clone());
      mdlgrp.add(electronica["monitor1"].clone());
      if (brensjParams.afwerking === "cosy") {
        mdlgrp.add(verwarming["verwarming_cosy"].clone());
      } else if (
        brensjParams.afwerking === "premium" ||
        brensjParams.afwerking === "high-end"
      ) {
        mdlgrp.add(electronica["tablet1"].clone());
        mdlgrp.add(verwarming["verwarming_premium"].clone());
      }
    } else if (
      brensjParams.work === "work-2a" ||
      brensjParams.work === "work-2b"
    ) {
      afwerkingModule = "work-2";
      //work2
      if (mdlnmbr === brensjParams.modules - 1) {
        if (brensjParams.work === "work-2b") {
          const tafel1 = meubilair["tafel2"].clone();
          tafel1.scale.x = -tafel1.scale.x;
          tafel1.position.set(
            tafel1.position.x + 13.35,
            tafel1.position.y,
            tafel1.position.z - 7.35
          );
          tafel1.rotation.y = Math.PI;
          const tafel2 = meubilair["tafel2"].clone();
          tafel2.position.set(
            tafel2.position.x + 13.35,
            tafel2.position.y,
            tafel2.position.z
          );
          if (brensjParams.afwerking === "cosy") {
            mdlgrp.add(verwarming["verwarming_cosy_left"].clone());
          } else if (
            brensjParams.afwerking === "premium" ||
            brensjParams.afwerking === "high-end"
          ) {
            mdlgrp.add(verwarming["verwarming_premium_left"].clone());
          }
          mdlgrp.add(tafel1, tafel2);
        } else if (brensjParams.work === "work-2a") {
          mdlgrp.add(meubilair["work1_meub"].clone());
          const plugLeft = plugs["right"].clone();
          plugLeft.scale.z = -plugLeft.scale.z;
          plugLeft.position.x = -plugLeft.position.x;
          plugLeft.position.z = -plugLeft.position.z;
          mdlgrp.add(plugLeft);
          if (brensjParams.afwerking === "cosy") {
            mdlgrp.add(verwarming["verwarming_cosy_left"].clone());
          } else if (
            brensjParams.afwerking === "premium" ||
            brensjParams.afwerking === "high-end"
          ) {
            mdlgrp.add(verwarming["verwarming_premium_left"].clone());
          }
        }
      } else {
        if (brensjParams.work === "work-2b") {
          const kast1 = meubilair["kast1_meub"].clone();
          kast1.position.z -= 5;
          mdlgrp.add(kast1);
        } else if (brensjParams.work === "work-2a") {
          mdlgrp.add(electronica["monitor1"].clone());
        }
        if (
          brensjParams.afwerking === "premium" ||
          brensjParams.afwerking === "high-end"
        ) {
          mdlgrp.add(electronica["tablet1"].clone());
        }
        mdlgrp.add(meubilair["tafel1"].clone());
        const results = cutOutWalls(sidemodel, result, result1, mdlgrp, 1);
        result = results[0];
        result1 = results[1];
      }
      mdlgrp.add(plugs["right"].clone());
    } else if (
      brensjParams.work === "work-3a" ||
      brensjParams.work === "work-3b"
    ) {
      afwerkingModule = "work-3";
      //work3
      if (mdlnmbr === 1) {
        //mid module
        // //2nd window
        results = cutOutWalls(sidemodel, result, result1, mdlgrp, 1);
        result = results[0];
        result1 = results[1];
        results = cutOutWalls(sidemodel, result, result1, mdlgrp, 3);
        result = results[0];
        result1 = results[1];
      } else if (mdlnmbr === brensjParams.modules - 1) {
        //achterste module
        results = cutOutWalls(sidemodel, result, result1, mdlgrp, 5);
        result = results[0];
        result1 = results[1];
        let verwarmingrechts;
        if (brensjParams.afwerking === "cosy") {
          verwarmingrechts = verwarming["verwarming_cosy_left"].clone();
        } else if (
          brensjParams.afwerking === "premium" ||
          brensjParams.afwerking === "high-end"
        ) {
          verwarmingrechts = verwarming["verwarming_premium_left"].clone();
        }
        verwarmingrechts.scale.z = -verwarmingrechts.scale.z;
        verwarmingrechts.position.x = -verwarmingrechts.position.x;
        mdlgrp.add(verwarmingrechts);
      }
      if (mdlnmbr === 0) {
        //voorste module
        if (brensjParams.work === "work-3a") {
          mdlgrp.add(meubilair["tafel1"].clone());
          const tussenscheiding = frameOpvulling["fwindow1"].clone();
          tussenscheiding.position.z = bbox.min.z + 4;
          mdlgrp.add(tussenscheiding.clone());
          mdlgrp.add(meubilair["kast2_meub"].clone());
        } else if (brensjParams.work === "work-3b") {
          mdlgrp.add(kot.clone());
          mdlgrp.add(meubilair["eet1_meub"].clone());
        }
        if (brensjParams.afwerking === "cosy") {
          const verwarmingrechts = verwarming["verwarming_cosy_left"].clone();
          verwarmingrechts.scale.z = -verwarmingrechts.scale.z;
          verwarmingrechts.position.x = -verwarmingrechts.position.x;
          mdlgrp.add(verwarmingrechts);
        } else {
          mdlgrp.add(electronica["tablet1"].clone());
        }
        mdlgrp.add(meubilair["kast1_meub"].clone());
        result = gvl;
        result1 = bnnn;
      } else {
        const tafel1 = meubilair["tafel2"].clone();
        tafel1.scale.z = -tafel1.scale.z;
        tafel1.position.set(
          tafel1.position.x,
          tafel1.position.y,
          tafel1.position.z - 7.35
        );
        const tafel2 = meubilair["tafel2"].clone();
        mdlgrp.add(tafel1, tafel2);
      }
      mdlgrp.add(plugs["right"].clone());
    } else if (
      brensjParams.work === "work-4a" ||
      brensjParams.work === "work-4b"
    ) {
      afwerkingModule = "work-4";
      //work 4
      let verwarmingrechts;
      //mdl voorste
      if (mdlnmbr === 0) {
        //4a
        if (brensjParams.work === "work-4a") {
          mdlgrp.add(meubilair["kast1_meub"].clone());
          mdlgrp.add(kot.clone());
          mdlgrp.add(meubilair["eet1_meub"].clone());
          //PREM + HE
          if (
            brensjParams.afwerking === "premium" ||
            brensjParams.afwerking === "high-end"
          ) {
            mdlgrp.add(electronica["tablet1"].clone());
          }
          //COSY
          else if (brensjParams.afwerking === "cosy") {
            verwarmingrechts = verwarming["verwarming_cosy_left"].clone();
            verwarmingrechts.scale.z = -verwarmingrechts.scale.z;
            verwarmingrechts.position.x = -verwarmingrechts.position.x;
            mdlgrp.add(verwarmingrechts);
          }
        }
        //4b
        else if (brensjParams.work === "work-4b") {
          mdlgrp.add(meubilair["tafel4"].clone());
          //PREM + HE
          if (
            brensjParams.afwerking === "premium" ||
            brensjParams.afwerking === "high-end"
          ) {
            mdlgrp.add(electronica["tablet1"].clone());
          }
          //COSY
          else if (brensjParams.afwerking === "cosy") {
            mdlgrp.add(verwarming["verwarming_cosy_left"].clone());
          }
        }
        result = gvl;
        result1 = bnnn;
      } else if (mdlnmbr === 1) {
        //windows
        results = cutOutWalls(sidemodel, result, result1, mdlgrp, 1);
        result = results[0];
        result1 = results[1];
        //4a
        if (brensjParams.work === "work-4a") {
          mdlgrp.add(meubilair["tafel3"].clone());
          //PREM + HE
          if (
            brensjParams.afwerking === "premium" ||
            brensjParams.afwerking === "high-end"
          ) {
          }
          //COSY
        }
        //4b
        else if (brensjParams.work === "work-4b") {
          const tafel = meubilair["tafel4"].clone();
          tafel.position.z += 0.5;
          mdlgrp.add(tafel);
          //PREM + HE
          if (
            brensjParams.afwerking === "premium" ||
            brensjParams.afwerking === "high-end"
          ) {
            mdlgrp.add(verwarming["verwarming_premium_left"].clone());
            // mdlgrp.add(electronica["tablet1"].clone());
          }
          //COSY
        }
      } else if (mdlnmbr === 2) {
        //windows
        results = cutOutWalls(sidemodel, result, result1, mdlgrp, 6);
        result = results[0];
        result1 = results[1];
        results = cutOutWalls(sidemodel, result, result1, mdlgrp, 4);
        result = results[0];
        result1 = results[1];
        //4a
        if (brensjParams.work === "work-4a") {
          mdlgrp.add(meubilair["tafel3"].clone());
          //PREM + HE
          //COSY
        }
        //4b
        if (brensjParams.work === "work-4b") {
          const tafel = meubilair["tafel4"].clone();
          tafel.position.z += 1;
          mdlgrp.add(tafel);
          //PREM + HE
          //COSY
        }
      }
      //mdl laatste
      else if (brensjParams.modules - 1) {
        //4a
        if (brensjParams.work === "work-4a") {
          mdlgrp.add(meubilair["tafel3"].clone());
          //PREM + HE
          if (
            brensjParams.afwerking === "premium" ||
            brensjParams.afwerking === "high-end"
          ) {
            verwarmingrechts = verwarming["verwarming_premium_left"].clone();
          }
          //COSY
          else if (brensjParams.afwerking === "cosy") {
            verwarmingrechts = verwarming["verwarming_cosy_left"].clone();
          }
          verwarmingrechts.scale.z = -verwarmingrechts.scale.z;
          verwarmingrechts.position.x = -verwarmingrechts.position.x;
          mdlgrp.add(verwarmingrechts);
        }
        //4b
        else if (brensjParams.work === "work-4b") {
          const bboxkot = new THREE.Box3().setFromObject(kot);
          const kot1 = kot.clone();
          const kot2 = kot.clone();
          kot1.scale.x = kot2.scale.x = -kot1.scale.x;
          kot2.position.z += bboxkot.max.z - bboxkot.min.z;
          mdlgrp.add(kot1, kot2, meubilair["kast5_meub"].clone());
          //PREM + HE
          // -----
          //COSY
          if (brensjParams.afwerking === "cosy") {
            mdlgrp.add(verwarming["verwarming_cosy_left"].clone());
          }
        }
        result = gvl;
        result1 = bnnn;
      }
      mdlgrp.add(plugs["right"].clone());
    }
  } else if (brensjParams.work.substring(0, 4) === "live") {
    if (
      brensjParams.work === "live-care-3" ||
      brensjParams.work === "live-care-3-rv"
    ) {
      afwerkingModule = "live-care-3";
      if (mdlnmbr === 0) {
        //voorste module
        if (brensjParams.work === "live-care-3") {
          mdlgrp.add(meubilair["kast6_meub_nr"].clone());
        } else if (brensjParams.work === "live-care-3-rv") {
          mdlgrp.add(meubilair["kast6_meub"].clone());
        }
        if (brensjParams.afwerking === "high-end") {
          mdlgrp.add(meubilair["kast6_meub_up"].clone());
        } else {
          mdlgrp.add(meubilair["kast6_meub_up_2"].clone());
        }
        mdlgrp.add(meubilair["tafel1"].clone());
        mdlgrp.add(meubilair["zetel1_meub"].clone());
      } else if (mdlnmbr === 1) {
        const results = cutOutWalls(sidemodel, result, result1, mdlgrp, 3);
        result = results[0];
        result1 = results[1];
        const lowWall = frameOpvulling["fframetussenscheiding2"].clone();
        lowWall.position.z -= 7;
        mdlgrp.add(lowWall);
        mdlgrp.add(meubilair["kast3_meub"].clone());
        mdlgrp.add(meubilair["kast4_meub"].clone());
        mdlgrp.add(meubilair["bed1_meub"].clone());
        mdlgrp.add(meubilair["bed1_meub_matras"].clone());
        mdlgrp.add(frameOpvulling["fframetussenscheiding3"].clone());
        if (
          brensjParams.afwerking === "premium" ||
          brensjParams.afwerking === "high-end"
        ) {
          mdlgrp.add(meubilair["kast4_meub_laden"].clone());
        }
      } else if (mdlnmbr === brensjParams.modules - 1) {
        //achterste
        mdlgrp.add(frameOpvulling["fframetussenscheiding1_2"].clone());
        mdlgrp.add(frameOpvulling["fframetussenscheiding1_ceiling"].clone());
        mdlgrp.add(meubilair["kast8_meub"].clone());
        mdlgrp.add(meubilair["wasmachine1_meub"].clone());
        mdlgrp.add(meubilair["toilet_meub"].clone());
        mdlgrp.add(meubilair["douche_meub"].clone());
        if (brensjParams.work === "live-care-3") {
          mdlgrp.add(meubilair["wasbak1_meub_nr"].clone());
        } else if (brensjParams.work === "live-care-3-rv") {
          mdlgrp.add(meubilair["wasbak1_meub"].clone());
        }
      }
    } else if (
      brensjParams.work === "live-care-4" ||
      brensjParams.work === "live-care-4-rv"
    ) {
      afwerkingModule = "live-care-4";
      if (mdlnmbr === 0) {
        //voorste module
        if (brensjParams.work === "live-care-4") {
          mdlgrp.add(meubilair["kast6_meub_nr"].clone());
        } else if (brensjParams.work === "live-care-4-rv") {
          mdlgrp.add(meubilair["kast6_meub"].clone());
        }
        if (brensjParams.afwerking === "high-end") {
          mdlgrp.add(meubilair["kast6_meub_up"].clone());
        } else {
          mdlgrp.add(meubilair["kast6_meub_up_2"].clone());
        }
        mdlgrp.add(meubilair["tafel1"].clone());
      } else if (mdlnmbr === 1) {
        const results = cutOutWalls(sidemodel, result, result1, mdlgrp, 1);
        result = results[0];
        result1 = results[1];
        mdlgrp.add(meubilair["kast4_meub_2"].clone());
        mdlgrp.add(meubilair["kast4_meub_2_1"].clone());
        mdlgrp.add(meubilair["kast4_meub_2_1_laden"].clone());
        mdlgrp.add(frameOpvulling["fframetussenscheiding3"].clone());
        if (
          brensjParams.afwerking === "premium" ||
          brensjParams.afwerking === "high-end"
        ) {
          mdlgrp.add(meubilair["kast4_meub_2_laden"].clone());
        }
        const tussenScheiding =
          frameOpvulling["fframetussenscheiding1"].clone();
        tussenScheiding.position.z -= 17;
        mdlgrp.add(tussenScheiding);
        mdlgrp.add(meubilair["zetel1_1_meub"].clone());
      } else if (mdlnmbr === 2) {
        const results = cutOutWalls(sidemodel, result, result1, mdlgrp, 1);
        result = results[0];
        result1 = results[1];
        mdlgrp.add(meubilair["bed2_meub"]);
        mdlgrp.add(meubilair["bed2_meub_matras"]);
        mdlgrp.add(meubilair["kast3_meub"].clone());
        mdlgrp.add(meubilair["kast4_meub_1"].clone());
        if (brensjParams.afwerking !== "cosy") {
          mdlgrp.add(meubilair["kast4_meub_1_laden"].clone());
        }
      } else if (mdlnmbr === brensjParams.modules - 1) {
        //achterste
        mdlgrp.add(frameOpvulling["fframetussenscheiding1_2"].clone());
        mdlgrp.add(frameOpvulling["fframetussenscheiding1_ceiling"].clone());
        mdlgrp.add(meubilair["kast8_meub"].clone());
        mdlgrp.add(meubilair["wasmachine1_meub"].clone());
        mdlgrp.add(meubilair["toilet_meub"].clone());
        mdlgrp.add(meubilair["douche_meub"].clone());
        if (brensjParams.work === "live-care-4") {
          mdlgrp.add(meubilair["wasbak1_meub_nr"].clone());
        } else if (brensjParams.work === "live-care-4-rv") {
          mdlgrp.add(meubilair["wasbak1_meub"].clone());
        }
      }
    }
  }
  //add to group
  // since CSG returns a non-indexed geometry, we use mergeVertices to make it
  // indexed, so the model can be viewed in AR.
  result.geometry = BufferGeometryUtils.mergeVertices(result.geometry);
  result1.geometry = BufferGeometryUtils.mergeVertices(result1.geometry);
  mdlgrp.add(result);
  mdlgrp.add(result1);
};
const cutOutWalls = (objct, result, result1, mdlgrp, wallPos) => {
  //csg
  const name = result.name;
  const obj = objct.clone();
  obj.position.set(obj.position.x - 0.2, obj.position.y, obj.position.z);
  const bbx = new THREE.Box3().setFromObject(obj);
  const meshB = bool.clone();
  meshB.scale.set(10, (bbx.max.y - bbx.min.y) / 2, (bbx.max.z - bbx.min.z) / 2);
  //module positions
  ////////////////
  //pos4        //pos1
  //            //
  //pos5        //pos2
  //            //
  //pos6        //pos3
  ////////voor//////
  if (wallPos === 1) {
  } else if (wallPos === 2) {
    obj.position.set(obj.position.x, obj.position.y, obj.position.z + 5);
  } else if (wallPos === 3) {
    obj.position.set(obj.position.x, obj.position.y, obj.position.z + 10);
  } else if (wallPos === 4) {
    obj.position.set(-obj.position.x - 0.55, obj.position.y, obj.position.z);
  } else if (wallPos === 5) {
    obj.position.set(
      -obj.position.x - 0.55,
      obj.position.y,
      obj.position.z + 5
    );
  } else if (wallPos === 6) {
    obj.position.set(
      -obj.position.x - 0.55,
      obj.position.y,
      obj.position.z + 10
    );
  } else if (wallPos === 7) {
    obj.position.set(
      -obj.position.x + 11,
      obj.position.y,
      obj.position.z - 8.8
    );
    obj.rotation.y = Math.PI;
    meshB.rotation.y = Math.PI / 2;
  }
  meshB.position.set(obj.position.x, obj.position.y, obj.position.z);
  //update matrix
  result.updateMatrix();
  result1.updateMatrix();
  meshB.updateMatrix();
  //subtract and add
  mdlgrp.add(obj);

  const results = [];
  result = CSG.subtract(result, meshB);
  result1 = CSG.subtract(result1, meshB);

  results.push(result);
  results.push(result1);
  if (name === "binnengevel_back") {
    result.name = "binnengevel_back";
    result1.name = brensjParams.back.name;
  } else {
    result.name = "gevel";
    result1.name = "binnengevel";
  }
  return results;
};
/**
 * brensj instantieren
 */
const cleanup = (obj) => {
  for (var i = obj.children.length - 1; i >= 0; i--) {
    if (obj.children[i] instanceof THREE.Mesh) {
      obj.children[i].geometry.dispose();
      obj.children[i].material.dispose();
      obj.children[i].parent.remove(obj.children[i]);
    } else {
      cleanup(obj.children[i]);
    }
  }
  if (obj !== null) {
    if (obj.parent !== null) {
      obj.parent.remove(obj);
    }
  }
};
const setWork = () => {
  const backGevel = "b" + brensjParams.gevel;
  if (brensjParams.work === "work-1") {
    brensjParams.front = "fwindow1";
    brensjParams.back = backGevel;
    brensjParams.moduleID = 1951;
  } else if (brensjParams.work === "work-2a") {
    brensjParams.front = "fwindow1";
    brensjParams.back = "fwindow2";
    brensjParams.moduleID = 1952;
  } else if (brensjParams.work === "work-2b") {
    brensjParams.front = "fwindow1";
    brensjParams.back = "fwindow2";
    brensjParams.moduleID = 1953;
  } else if (brensjParams.work === "work-3a") {
    brensjParams.front = "fwindow1";
    brensjParams.back = "fwindow2";
    brensjParams.moduleID = 1954;
  } else if (brensjParams.work === "work-3b") {
    brensjParams.front = "fwindow1";
    brensjParams.back = "fwindow2";
    brensjParams.moduleID = 1955;
  } else if (brensjParams.work === "work-4a") {
    brensjParams.front = "fwindow1";
    brensjParams.back = "fwindow2";
    brensjParams.moduleID = 1956;
  } else if (brensjParams.work === "work-4b") {
    brensjParams.front = "fwindow1";
    brensjParams.back = backGevel;
    brensjParams.moduleID = 1957;
  } else if (
    brensjParams.work === "live-care-3"){
      brensjParams.front = "fwindow1";
    brensjParams.back = backGevel;
    brensjParams.moduleID = 2225;
    }else if (
    brensjParams.work === "live-care-4"){
      brensjParams.front = "fwindow1";
    brensjParams.back = backGevel;
    brensjParams.moduleID = 2226;
    } else if (
    brensjParams.work === "live-care-3-rv"
  ) {
    brensjParams.front = "fwindow1";
    brensjParams.back = backGevel;
    brensjParams.moduleID = 2251;
  } else if (
    brensjParams.work === "live-care-4-rv"
  ) {
    brensjParams.front = "fwindow1";
    brensjParams.back = backGevel;
    brensjParams.moduleID = 2252;
  }
  instantiateBrensj();
};
const instantiateBrensj = () => {
  removeButtonElements();
  removeCameras();
  if (moduleGroup.children.length > 0) {
    cleanup(moduleGroup);
    aantalModules(
      brensjParams.modules,
      brensjParams.gevel,
      "binnengevel",
      "vloer",
      brensjParams.front,
      brensjParams.back
    );
  } else {
    aantalModules(
      brensjParams.modules,
      brensjParams.gevel,
      "binnengevel",
      "vloer",
      brensjParams.front,
      brensjParams.back
    );
  }
  updateAllMaterials();
  showProduct();
  calculatePrice();
  createBulletinP();
  toggleDecoration();
  extraOptions();
};
/**
 * sky
 */
let sky, sun;
function initSky() {
  // Add Sky
  sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);
  sun = new THREE.Vector3();
  /// GUI
  const effectController = {
    turbidity: 0.3,
    rayleigh: 0.3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 8.6,
    azimuth: 147,
    exposure: renderer.toneMappingExposure,
  };
  function guiChanged() {
    const uniforms = sky.material.uniforms;
    uniforms["turbidity"].value = effectController.turbidity;
    uniforms["rayleigh"].value = effectController.rayleigh;
    uniforms["mieCoefficient"].value = effectController.mieCoefficient;
    uniforms["mieDirectionalG"].value = effectController.mieDirectionalG;
    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms["sunPosition"].value.copy(sun);
    renderer.toneMappingExposure = effectController.exposure;
    renderer.render(scene, camera);
  }
  gui.add(effectController, "turbidity", 0.0, 20.0, 0.1).onChange(guiChanged);
  gui.add(effectController, "rayleigh", 0.0, 4, 0.001).onChange(guiChanged);
  gui
    .add(effectController, "mieCoefficient", 0.0, 0.1, 0.001)
    .onChange(guiChanged);
  gui
    .add(effectController, "mieDirectionalG", 0.0, 1, 0.001)
    .onChange(guiChanged);
  gui.add(effectController, "elevation", 0, 90, 0.1).onChange(guiChanged);
  gui.add(effectController, "azimuth", -180, 180, 0.1).onChange(guiChanged);
  gui.add(effectController, "exposure", 0, 1, 0.0001).onChange(guiChanged);
  guiChanged();
}
initSky();
const cameraPosities = {
  0: new THREE.Vector3(-3, 3, -8),
};
let cameras = [];
//change camera position *************************************************************************
let freeCam = false;
let pos;
let tar;
let tar2;
// const createCamera = (camPos,tarPos) =>{
//   const cam = new THREE.PerspectiveCamera(fov, ratio, near, far);
//   cam.position.set(camPos.x,camPos.y,camPos.z);
//   cam.target = tarPos;
//   cameras.push(cam);
//   scene.add(cam);
// }
const removeCameras = () => {
  for (const cam of cameras) {
    scene.remove(cam);
  }
  cameras = [];
};
const changeCameraPosition = () => {
  pos = new THREE.Vector3(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  if (brensjParams.camPos === 0) {
    if (!freeCam) {
      tar = new THREE.Vector3(
        cameraPosities[0].x,
        cameraPosities[0].y,
        cameraPosities[0].z
      );
      freeCam = true;
      tar2 = new THREE.Vector3(0, 1.5, 1);
    }
  } else {
    tar = new THREE.Vector3(
      cameraPosities[brensjParams.camPos].x,
      cameraPosities[brensjParams.camPos].y,
      cameraPosities[brensjParams.camPos].z
    );
    tar2 = new THREE.Vector3(0, 1.5, tar.z + 1.25);
    freeCam = false;

    // const tweenTar = new TWEEN.Tween(tar).to(tar2, 1000);
    // tweenTar.onUpdate(function () {
    //   controls.target.set(tar2.x, tar2.y, tar2.z + 0.001);
    // });
    // tweenTar.start();
  }
  const tweenPos = new TWEEN.Tween(pos).to(tar, 1000);
  camTarget = tar2;
  tweenPos.onUpdate(function () {
    camera.position.set(pos.x, pos.y, pos.z);
  });
  tweenPos.start();
};
//afwerkingsimages ********************************************************************************
const codeElement = document.getElementById("code-value");
const cosyImg = document.querySelector('label[for="cosy"] .keuze-img');
const premiumImg = document.querySelector('label[for="premium"] .keuze-img');
const highendImg = document.querySelector('label[for="high-end"] .keuze-img');
const showProduct = () => {
  //plan
  const wrk = brensjParams.work;
  let type,
    ttype,
    rolstoel = "";
  switch (wrk) {
    case "work-1":
      ttype = "work";
      type = "";
      rolstoel = "";
      break;
    case "work-2a":
      ttype = "work";
      type = "a";
      rolstoel = "";
      break;
    case "work-2b":
      ttype = "work";
      type = "b";
      rolstoel = "";
      break;
    case "work-3a":
      ttype = "work";
      type = "a";
      rolstoel = "";
      break;
    case "work-3b":
      ttype = "work";
      type = "b";
      rolstoel = "";
      break;
    case "work-4a":
      ttype = "work";
      type = "a";
      rolstoel = "";
      break;
    case "work-4b":
      ttype = "work";
      type = "b";
      rolstoel = "";
      break;
    case "live-care-3":
      ttype = "care";
      type = "";
      rolstoel = "";
      break;
    case "live-care-3-rv":
      ttype = "care";
      type = "";
      rolstoel = "_RV";
      break;
    case "live-care-4":
      ttype = "care";
      type = "";
      rolstoel = "";
      break;
    case "live-care-4-rv":
      ttype = "care";
      type = "";
      rolstoel = "_RV";
      break;
    default:
      type = "";
      break;
  }
  //gevel1
  const gvl = brensjParams.gevel;
  //wanden
  const bnM = brensjParams.binnenMateriaal.name.substr(0, 1);
  //vloer
  const vlM = brensjParams.vloerMateriaal.name.substr(0, 1);
  //afwerking
  const afw = brensjParams.afwerking.substr(0, 1);
  //Product Code
  codeElement.innerHTML =
    brensjParams.modules +
    bnM.toUpperCase() +
    vlM.toUpperCase() +
    afw.toUpperCase();

  //afwerkings images
  //work
  cosyImg.style.backgroundImage =
    "url('" +
    path +
    "afwerking/" +
    ttype +
    "/" +
    brensjParams.modules +
    type +
    bnM.toUpperCase() +
    vlM.toUpperCase() +
    "C" +
    rolstoel +
    ".jpg')";
  premiumImg.style.backgroundImage =
    "url('" +
    path +
    "afwerking/" +
    ttype +
    "/" +
    brensjParams.modules +
    type +
    bnM.toUpperCase() +
    vlM.toUpperCase() +
    "P" +
    rolstoel +
    ".jpg')";
  highendImg.style.backgroundImage =
    "url('" +
    path +
    "afwerking/" +
    ttype +
    "/" +
    brensjParams.modules +
    type +
    bnM.toUpperCase() +
    vlM.toUpperCase() +
    "H" +
    rolstoel +
    ".jpg')";
};
//***********************************************************************EXTRA OPTIONS*************************************************************************************/
const extraOptionsMenu = document.getElementById("extra-options");
const extraOptionsDiv = document.getElementById("extra-options-div");

const extraOptions = () => {
  // jQuery(document).ready(function () {
  while (jQuery("#extra-options").has("option").length > 0) {
    // jQuery(extraOptionsMenu )[0].sumo.remove([extraOptionsMenu.querySelectorAll('option')].findIndex(option => option.value == 'yourValue'))
    // console.log(extraOptionsMenu.firstChild);
    // extraOptionsMenu.removeChild(extraOptionsMenu.firstChild);
    jQuery("#extra-options")[0].sumo.remove(0);
  }
  // });
  // if(extraOptionsMenu.childNodes.length > 0){
  //   console.log("test");
  //   for (let i = 0; i < extraOptionsMenu.childNodes.length; i++) {
  //     jQuery('#extra-options')[0].sumo.remove(i);
  //   }
  // }
  // }
  var i = 0;
  for (const element in data_extra) {
    const extras_title = data_extra[element].title;
    const extra_meerprijs_per_module = data_extra[element].meerprijs_per_module;
    for (const module in extra_meerprijs_per_module) {
      const meerprijsModule =
        extra_meerprijs_per_module[module].meerprijs_voor_deze_modules;
      let alreadyAdded = false;
      for (const child of extra_meerprijs_per_module[module].gelinkte_module) {
        if (brensjParams.moduleID === child.ID && !alreadyAdded) {
          alreadyAdded = true;
          extraOptionsMenu.sumo.add(
            extras_title,
            extras_title + "\t( + ??? " + meerprijsModule + " )",
            0,
            { "data-optie-id": data_extra[element].id }
          );
          extraOptionsMenu.children[0].setAttribute(
            "data-optie-id",
            data_extra[element].id
          );
        }
      }
    }
    //extraOptionsMenu.sumo.add(data_extra[element].title,data_extra[element].title) + "\t( + ??? " + data_extra[element].prijs + " )",i, {'data-prijs': data_extra[element].prijs});
    // const option = document.createElement("option");
    // option.value = data_extra[element].naam;
    // option.innerHTML = data_extra[element].naam //+ "\t( + ??? " + data_extra[element].prijs + " )";
    // extraOptionsMenu.appendChild(option);
    i++;
  }
  extraOptionsEventListener();
};
function clearContents() {
  extraOptionsDiv.innerHTML = "";
  meerPrijsExtraOpties = 0;
}
let sumoMenu;
const extraOptionsEventListener = () => {
  sumoMenu.addEventListener("change", (e) => {
    // const selectedList = document.querySelectorAll('.opt.selected')
    const selectedList = jQuery("#extra-options").val();
    clearContents();
    for (const element of selectedList) {
      for (const datOpt in data_extra) {
        if (element === data_extra[datOpt].title) {
          extraOptionsDiv.innerHTML +=
            "\n<b>" + element + "</b>" + data_extra[datOpt].extra_info_optie;
          const extra_meerprijs_per_module =
            data_extra[datOpt].meerprijs_per_module;
          for (const module in extra_meerprijs_per_module) {
            const meerprijsModule =
              extra_meerprijs_per_module[module].meerprijs_voor_deze_modules;
            let alreadyAdded = false;
            for (const child of extra_meerprijs_per_module[module]
              .gelinkte_module) {
              if (brensjParams.moduleID === child.ID && !alreadyAdded) {
                alreadyAdded = true;
                meerPrijsExtraOpties += parseFloat(meerprijsModule);
              }
            }
          }
        }
      }
    }
    calculatePrice();
  });
};
//***********************************************************************STAP 5 OVERZICHT**********************************************************************************/
const step5Container = document.getElementById("overzichtContainer");
// const step5leftSide = document.getElementById("step5leftSide");
// const step5RightSide = document.getElementById("step5RightSide");
// const step5PriceSide = document.getElementById("step5PriceSide");
let overzichtSamenstelling;
const Overzicht = () => {
  while (step5Container.firstChild) {
    step5Container.removeChild(step5Container.lastChild);
  }
  const list = document.createElement("ul");
  overzichtSamenstelling = {
    Module: brensjParams.work,
    Gevel: brensjParams.gevel,
    Binnen: brensjParams.binnenMateriaal.name,
    Vloer: brensjParams.vloerMateriaal.name,
    Afwerking: brensjParams.afwerking,
    Extra: "vergaderen",
  };
  for (const property in overzichtSamenstelling) {
    let meerprijs = 0;
    switch (property) {
      case "Module":
        meerprijs = prijsModule;
        break;
      case "Gevel":
        meerprijs = meerprijsGevel;
        break;
      case "Binnen":
        meerprijs = meerprijsBinnen;
        break;
      case "Vloer":
        meerprijs = meerprijsVloer;
        break;
      case "Afwerking":
        meerprijs = meerprijsAfwerking;
        break;
      case "Extra":
        meerprijs = meerPrijsExtraOpties;
        break;
    }
    meerprijs = formatter.format(meerprijs);
    const row = document.createElement("li");
    const leftDiv = document.createElement("div");
    leftDiv.classList.add("step5leftSide");
    leftDiv.innerHTML = property;
    const midDiv = document.createElement("div");
    midDiv.classList.add("step5MidSide");
    midDiv.innerHTML = overzichtSamenstelling[property];
    const rightDiv = document.createElement("div");
    rightDiv.classList.add("step5RightSide");
    rightDiv.innerHTML = meerprijs;
    row.appendChild(leftDiv);
    row.appendChild(midDiv);
    row.appendChild(rightDiv);
    // row.innerHTML = property+": "+overzichtSamenstelling[property]+""+meerprijs+"\n";
    list.appendChild(row);
    // step5RightSide.appendChild(rightDiv);
    // step5PriceSide.appendChild(priceSpan);
  }
  step5Container.appendChild(list);
};
/*********************************************************************************************************************************************************************************
 * prijs bepalingen
 */
let price = document.querySelector(".price-value");
//meerprijzen
let prijsModule = 0;
let meerprijsGevel = 0;
let meerprijsBinnen = 0;
let meerprijsVloer = 0;
let meerprijsAfwerking = 0;
let meerPrijsExtraOpties = 0;
let afwerkingText;
//prijs visualisatie vars
const afwerkingKeuzePrijs = document.querySelector(
  ".afwerkingsniveau-container .option-wrapper"
);
const vloerKeuzePrijs = document.querySelector(
  ".vloerawerking-container .option-wrapper"
);
const binnenKeuzePrijs = document.querySelector(
  ".container-enkel .option-wrapper"
);
const gevelKeuzePrijs = document.querySelector(
  ".container-dubbel .option-wrapper"
);
// console.log(gevelafwerking_arr);
const calculatePrice = () => {
  //fase 1 work
  // var modulePrijs = parseFloat(
  //   jQuery("#step1 .option-wrapper label input:checked").attr("data-basisprijs")
  // );
  // console.log(modulePrijs);
  modulePrijsBepaling(data_module);
  //fase 2 gevel
  gevelPrijsBepaling(data_gevel);
  //fase 3 binnenafwerking
  binnenPrijsBepaling(data_binnen);
  //fase 4 vloerafwerking
  vloerPrijsBepaling(data_vloer);
  //fase 5 afwerking
  afwerkingPrijsBepaling(data_afwerking);
  //totaal prijs
  var totaalPrijs =
    parseFloat(prijsModule) +
    parseFloat(meerprijsGevel) +
    parseFloat(meerprijsBinnen) +
    parseFloat(meerprijsVloer) +
    parseFloat(meerprijsAfwerking) +
    parseFloat(meerPrijsExtraOpties);

  // console.log(totaalPrijs);
  updatePrijs(totaalPrijs);
};
// PRIJS / PRICE format and set on page
function updatePrijs(totaalPrijs) {
  price.innerHTML = formatter.format(totaalPrijs);
}
//module prijsbepaling
const modulePrijsBepaling = (dat) => {
  prijsModule = 0;
  afwerkingText = null;
  for (const module in dat) {
    if (dat[module].id === brensjParams.moduleID) {
      const module_name = dat[module].name;
      const basisPrijs = dat[module].basisprijs_module;
      if (brensjParams.afwerking === "cosy") {
        afwerkingText = dat[module].cosy_text;
      } else if (brensjParams.afwerking === "premium") {
        afwerkingText = dat[module].premium_text;
      } else if (brensjParams.afwerking === "high-end") {
        afwerkingText = dat[module].high_end_text;
      }
      if (brensjParams.work === module_name.toLowerCase()) {
        prijsModule = basisPrijs;
      }
    }
  }
};
//gevel prijs bepaling
const gevelPrijsBepaling = (dat) => {
  meerprijsGevel = 0;
  for (const gevel in dat) {
    // console.log(Object.keys(dat[gevel]))
    const gevel_id = dat[gevel].id;
    const gevel_title = dat[gevel].title;
    const gevel_meerprijs_optie = dat[gevel].meerprijs_optie;
    if (gevel_meerprijs_optie) {
      if (brensjParams.gevel === gevel_title.toLowerCase()) {
        const gevel_meerprijs_per_module = dat[gevel].meerprijs_per_module;
        for (const module in gevel_meerprijs_per_module) {
          const meerprijsModule =
            gevel_meerprijs_per_module[module].meerprijs_voor_deze_modules;
          for (const child of gevel_meerprijs_per_module[module]
            .gelinkte_module) {
            if (brensjParams.moduleID === child.ID) {
              meerprijsGevel = meerprijsModule;
            }
          }
        }
      }
      for (const child of gevelKeuzePrijs.childNodes) {
        if (child["htmlFor"] === gevel_title.toLowerCase()) {
          const element = child.querySelector(".keuze-prijs");
          const gevel_meerprijs_per_module = dat[gevel].meerprijs_per_module;
          for (const module in gevel_meerprijs_per_module) {
            const meerprijsModule =
              gevel_meerprijs_per_module[module].meerprijs_voor_deze_modules;
            for (const c of gevel_meerprijs_per_module[module]
              .gelinkte_module) {
              if (brensjParams.moduleID === c.ID) {
                element.innerHTML = "+ ??? " + meerprijsModule;
              }
            }
          }
        }
      }
    }
  }
  // console.log(meerprijsGevel);
};
//binnen prijs bepaling
const binnenPrijsBepaling = (dat) => {
  meerprijsBinnen = 0;
  for (const binnen in dat) {
    // console.log(Object.keys(dat[gevel]))
    const binnen_id = dat[binnen].id;
    const binnen_title = dat[binnen].title;
    const binnen_meerprijs_optie = dat[binnen].meerprijs_optie;
    if (binnen_meerprijs_optie) {
      if (brensjParams.binnenMateriaal.name === binnen_title.toLowerCase()) {
        const binnen_meerprijs_per_module = dat[binnen].meerprijs_per_module;
        for (const module in binnen_meerprijs_per_module) {
          const meerprijsModule =
            binnen_meerprijs_per_module[module].meerprijs_voor_deze_modules;
          for (const child of binnen_meerprijs_per_module[module]
            .gelinkte_module) {
            if (brensjParams.moduleID === child.ID) {
              meerprijsBinnen = meerprijsModule;
            }
          }
        }
      }
      for (const child of binnenKeuzePrijs.childNodes) {
        if (child["htmlFor"] === binnen_title.toLowerCase()) {
          const element = child.querySelector(".keuze-prijs");
          const binnen_meerprijs_per_module = dat[binnen].meerprijs_per_module;
          for (const module in binnen_meerprijs_per_module) {
            const meerprijsModule =
              binnen_meerprijs_per_module[module].meerprijs_voor_deze_modules;
            for (const c of binnen_meerprijs_per_module[module]
              .gelinkte_module) {
              if (brensjParams.moduleID === c.ID) {
                element.innerHTML = "+ ??? " + meerprijsModule;
              }
            }
          }
        }
      }
    }
  }
};
const vloerPrijsBepaling = (dat) => {
  meerprijsVloer = 0;
  for (const vloer in dat) {
    // console.log(Object.keys(dat[vloer]))
    const vloer_id = dat[vloer].id;
    const vloer_title = dat[vloer].title;
    const vloer_meerprijs_optie = dat[vloer].meerprijs_optie;
    if (vloer_meerprijs_optie) {
      if (brensjParams.vloerMateriaal.name === vloer_title.toLowerCase()) {
        const vloer_meerprijs_per_module = dat[vloer].meerprijs_per_module;
        for (const module in vloer_meerprijs_per_module) {
          const meerprijsModule =
            vloer_meerprijs_per_module[module].meerprijs_voor_deze_modules;
          for (const child of vloer_meerprijs_per_module[module]
            .gelinkte_module) {
            if (brensjParams.moduleID === child.ID) {
              meerprijsVloer = meerprijsModule;
            }
          }
        }
      }
      for (const child of vloerKeuzePrijs.childNodes) {
        if (child["htmlFor"] === vloer_title.toLowerCase()) {
          const element = child.querySelector(".keuze-prijs");
          const vloer_meerprijs_per_module = dat[vloer].meerprijs_per_module;
          for (const module in vloer_meerprijs_per_module) {
            const meerprijsModule =
              vloer_meerprijs_per_module[module].meerprijs_voor_deze_modules;
            for (const c of vloer_meerprijs_per_module[module]
              .gelinkte_module) {
              if (brensjParams.moduleID === c.ID) {
                element.innerHTML = "+ ??? " + meerprijsModule;
              }
            }
          }
        }
      }
    }
  }
};
const afwerkingPrijsBepaling = (dat) => {
  meerprijsAfwerking = 0;
  for (const afwerking in dat) {
    // console.log(Object.keys(dat[afwerking]))
    const afwerking_id = dat[afwerking].id;
    const afwerking_title = dat[afwerking].title;
    const afwerking_meerprijs_optie = dat[afwerking].meerprijs_optie;
    if (afwerking_meerprijs_optie) {
      if (
        brensjParams.afwerking === afwerking_title.toLowerCase() ||
        (brensjParams.afwerking === "high-end" &&
          afwerking_title.toLowerCase() === "high end")
      ) {
        const afwerking_meerprijs_per_module =
          dat[afwerking].meerprijs_per_module;
        for (const module in afwerking_meerprijs_per_module) {
          const meerprijsModule =
            afwerking_meerprijs_per_module[module].meerprijs_voor_deze_modules;
          for (const child of afwerking_meerprijs_per_module[module]
            .gelinkte_module) {
            if (brensjParams.moduleID === child.ID) {
              meerprijsAfwerking = meerprijsModule;
            }
          }
        }
      }
      for (const child of afwerkingKeuzePrijs.childNodes) {
        if (
          child["htmlFor"] === afwerking_title.toLowerCase() ||
          (afwerking_title.toLowerCase() === "high end" &&
            child["htmlFor"] === "high-end")
        ) {
          const element = child.querySelector(".keuze-prijs");
          const afwerking_meerprijs_per_module =
            dat[afwerking].meerprijs_per_module;
          for (const module in afwerking_meerprijs_per_module) {
            const meerprijsModule =
              afwerking_meerprijs_per_module[module]
                .meerprijs_voor_deze_modules;
            for (const c of afwerking_meerprijs_per_module[module]
              .gelinkte_module) {
              if (brensjParams.moduleID === c.ID) {
                element.innerHTML = "+ ??? " + meerprijsModule;
              }
            }
          }
        }
      }
    }
  }
  Overzicht();
};
/*********************************************************************************************************************************
 *
 */
/***************************************************************************************************************************************************************************************
 * eventlisteners
 */
console.log(scene);
const modWerken = document.getElementById("modWerken");
const modWonen = document.getElementById("modWonen");
jQuery(document).ready(function ($) {
  $(".btn-module-type").on("click", function () {
    var current = $(this).attr("id");
    if (current === "0") {
      brensjParams.work = "work-1";
      brensjParams.modules = 1;
      modWerken.style.display = "none";
      modWonen.style.display = "";
    } else if (current === "1") {
      brensjParams.work = "live-care-3";
      brensjParams.modules = 3;
      modWerken.style.display = "";
      modWonen.style.display = "none";
    }
    price.innerHTML = "0,00";
    setWork();
    clearContents();
  });

  $(".modules-wonen input").on("click", function () {
    var current = $(this).attr("id");
    brensjParams.work = current;
    brensjParams.modules = parseInt(current.substring(5, 6));
    setWork();
    clearContents();
    // console.log(scene.children)
  });
  $(".modules-werken input").on("click", function () {
    var current = $(this).attr("id");
    brensjParams.work = current;
    brensjParams.modules = parseInt(current.substring(10, 11));
    setWork();
    clearContents();
  });
  //buitenafwerking
  $(".container-dubbel input").on("click", function () {
    var current = $(this).attr("id");
    setMaterial(current, "gevel");
  });
  //binnenafwerking
  $(".container-enkel input").on("click", function () {
    var current = $(this).attr("id");
    setMaterial(current, "binnen");
  });
  //vloer
  $(".vloerawerking-container input").on("click", function () {
    var current = $(this).attr("id");
    setMaterial(current, "vloer");
  });
  //afwerking
  $(".afwerkingsniveau-container input").on("click", function () {
    var current = $(this).attr("id");
    brensjParams.afwerking = current;
    afwerkingsNiveau();
  });
  //hidemenu
  $("#hideButton").on("click", function () {
    uiHide();
  });
  //dropdown
  jQuery(document).ready(function () {
    sumoMenu = jQuery("#extra-options").SumoSelect({
      placeholder: "kies hier",
    });
  });
});
//button to go back to module options
const mainMenu = document.querySelector(".module-type-selection-container");
const mainMenuBtn = document.getElementById("mainMenuBtn");
if (mainMenu !== null) {
  mainMenuBtn.addEventListener("click", () => {
    mainMenu.style.display = "";
    updateStep(1);
  });
}
//add camera buttons
const cam0 = document.getElementById("cam0");
if (cam0 !== null) {
  cam0.addEventListener("click", () => {
    brensjParams.camPos = 0;
    changeCameraPosition();
  });
}
const infoDiv = document.getElementById("info");
const addCameraButton = (camNr) => {
  let btn = document.createElement("button");
  btn.id = "cam" + camNr;
  btn.className = "cam";
  btn.innerHTML = camNr;
  infoDiv.appendChild(btn);
  btn.addEventListener("click", function () {
    brensjParams.camPos = camNr;
    changeCameraPosition();
  });
};
const removeButtonElements = () => {
  let arrHTML = infoDiv.querySelectorAll(".cam");
  for (const child of arrHTML) {
    if (child === cam0) {
    } else {
      child.parentElement.removeChild(child);
    }
  }
};
//inrichting tonen/verbergen
const checked = document.getElementById("inrichtingChckBx");
checked.addEventListener("change", () => {
  toggleDecoration();
});
const toggleDecoration = () => {
  // console.log( moduleGroup.children[0].children)
  if (checked.checked) {
    for (const mGroup of moduleGroup.children) {
      for (const child of mGroup.children) {
        if (
          checkArrayForElement(child, meubilair) ||
          checkArrayForElement(child, verwarming) ||
          checkArrayForElement(child, electronica)
        ) {
          child.visible = false;
        }
      }
    }
  } else {
    for (const mGroup of moduleGroup.children) {
      for (const child of mGroup.children) {
        if (
          checkArrayForElement(child, meubilair) ||
          checkArrayForElement(child, verwarming) ||
          checkArrayForElement(child, electronica)
        ) {
          child.visible = true;
        }
      }
    }
  }
};
const checkArrayForElement = (child, array) => {
  for (const element in array) {
    if (child.name === array[element].name) {
      // console.log(child.name + " / " + array[element].name)
      return true;
    }
  }
};
/**debug */
gui
  .add(brensjParams, "inbetweenSpace")
  .min(0)
  .max(100)
  .step(0.001)
  .onFinishChange(setWork);

// jQuery.post(ajax.url, data, function (response) {
//   var return_response = new CustomEvent("server_response", {
//     detail: { data: response },
//   });
//   window.dispatchEvent(return_response);
// });
