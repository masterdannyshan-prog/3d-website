import './style.css';
import './viewport.css';
import './loader.css';
import '@phosphor-icons/web/regular';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('#car');
const loading = document.querySelector('#loading');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const loadState={room:0,car:0,roomReady:false,carReady:false,rendered:false,failed:false};
let displayedProgress=10;
let loaderFrame;
const startedAt=performance.now();
const progressText=document.querySelector('#progress');
const meter=document.querySelector('#load-meter');
const fill=document.querySelector('#loader-fill');
document.querySelector('#design').inert=true;
document.querySelector('#retry-load').onclick=()=>location.reload();
function failLoading(message){
 loadState.failed=true;cancelAnimationFrame(loaderFrame);
 document.querySelector('#loader-label').textContent=message;
 document.querySelector('#retry-load').hidden=false;
 meter.hidden=true;document.querySelector('.loader-track').hidden=true;
}
function animateLoader(now){
 if(loadState.failed)return;
 const complete=loadState.roomReady&&loadState.carReady&&loadState.rendered;
 const target=complete?100:10+loadState.room*25+loadState.car*55;
 displayedProgress=Math.min(target,displayedProgress+Math.max(.15,(target-displayedProgress)*.075));
 const value=Math.floor(displayedProgress);
 progressText.textContent=String(value);meter.setAttribute('aria-valuenow',String(value));fill.style.transform=`scaleX(${displayedProgress/100})`;
 if(complete&&displayedProgress>99.8&&now-startedAt>(reduced.matches?0:1200)){
   progressText.textContent='100';meter.setAttribute('aria-valuenow','100');fill.style.transform='scaleX(1)';
   setTimeout(()=>{
     document.body.classList.replace('is-loading','is-revealed');
     document.querySelector('.hero').inert=false;document.querySelector('#design').inert=false;
     setTimeout(()=>loading.remove(),reduced.matches?0:1100);
   },reduced.matches?0:250);
   return;
 }
 loaderFrame=requestAnimationFrame(animateLoader);
}
loaderFrame=requestAnimationFrame(animateLoader);
const hero = document.querySelector('.hero');
document.querySelectorAll('.pill, .story-link').forEach(button=>{
 let icon=button.querySelector('span');
 if(!icon){
   const isClose=button.classList.contains('close');
   button.textContent=button.textContent.replace(/[↑×]/g,'').trim();
   icon=document.createElement('span');icon.setAttribute('aria-hidden','true');
   icon.textContent=isClose?'×':'↑';button.append(icon);
 }
 const glyph=document.createElement('i');
 const direction=button.classList.contains('close')?'x':button.classList.contains('story-link')?'arrow-down':button.getAttribute('href')==='#stage'?'arrow-up':'arrow-up-right';
 glyph.className=`ph ph-${direction}`;glyph.setAttribute('aria-hidden','true');
 icon.replaceChildren(glyph);
});
const scrollScene = document.createElement('div');
scrollScene.className = 'hero-scroll';
hero.before(scrollScene);
scrollScene.append(hero);
document.querySelector('.horizon')?.remove();
const story = document.querySelector('#story');
document.querySelector('#about').onclick = () => story.showModal();
story.querySelector('.close').onclick = () => story.close();
story.addEventListener('click', e => { if(e.target === story && (e.clientX < story.getBoundingClientRect().left || e.clientX > story.getBoundingClientRect().right)) story.close(); });

try {
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background=new THREE.Color('#14171a');
scene.fog=new THREE.Fog('#14171a',24,55);
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const environment = pmrem.fromScene(room, .04);
scene.environment = environment.texture;
scene.environmentIntensity = 1.1;
room.dispose(); pmrem.dispose();
const camera = new THREE.PerspectiveCamera(32,1,.1,100);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = !reduced.matches;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.zoomSpeed = .7;
controls.minPolarAngle = Math.PI*.28;
controls.maxPolarAngle = Math.PI*.485;
controls.autoRotateSpeed = 0;
controls.dampingFactor = .065;
let rotationSpeed = 0;
let interacting = false;
let resumeAt = 0;
let rotationEnabled = !reduced.matches;
const motionButton = document.querySelector('#motion');
motionButton.setAttribute('aria-pressed',String(rotationEnabled));
motionButton.textContent = rotationEnabled ? 'Pause motion' : 'Play motion';
motionButton.onclick=()=>{rotationEnabled=!rotationEnabled;motionButton.setAttribute('aria-pressed',String(rotationEnabled));motionButton.textContent=rotationEnabled?'Pause motion':'Play motion';};
canvas.style.touchAction='pan-y';
controls.target.set(0,.55,0);
const home = new THREE.Vector3(6,2.5,7);
let destination = null;
function setView(view='hero') {
 const factor = 1;
 const positions = {hero:[6,2.5,7],side:[9,1.65,0]};
 destination = new THREE.Vector3(...positions[view]).multiplyScalar(factor);
 controls.autoRotate = false;
 resumeAt = performance.now()+6000;
 wheelDistance = null;
 if(reduced.matches){camera.position.copy(destination);destination=null;controls.update();}
}
camera.position.copy(home);
controls.update();
let wheelDistance = null;
controls.addEventListener('start',()=>{destination=null;wheelDistance=null;interacting=true;controls.autoRotate=false;});
controls.addEventListener('end',()=>{interacting=false;resumeAt=performance.now()+6000;});
// Normal wheel scrolling belongs to the page. Shift + wheel is explicit model zoom.
const onWheel = event => {
 if(story.open)return;
 if(!event.shiftKey){event.stopImmediatePropagation();return;}
 event.preventDefault();event.stopImmediatePropagation();destination=null;
 resumeAt=performance.now()+6000;
 const amount = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
 wheelDistance = THREE.MathUtils.clamp((wheelDistance ?? camera.position.distanceTo(controls.target))*Math.exp(-amount*.001),controls.minDistance,controls.maxDistance);
};
hero.addEventListener('wheel',onWheel,{passive:false,capture:true});
const hemi = new THREE.HemisphereLight(0xd4eafa,0x09131c,2); scene.add(hemi);
const key = new THREE.DirectionalLight(0xe5f4ff,4); key.position.set(2,7,4); key.castShadow=true; key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.bias=-.001;scene.add(key);
const rim = new THREE.DirectionalLight(0x63c9ff,5);rim.position.set(-4,3,-3);scene.add(rim);
const fill = new THREE.DirectionalLight(0xa0b8ca,2);fill.position.set(5,2,-4);scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.5}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
// A restrained asphalt strip: faded ends and understated edge markings.
const roadCanvas = document.createElement('canvas');roadCanvas.width=256;roadCanvas.height=1024;
const ctx=roadCanvas.getContext('2d');
ctx.fillStyle='#17191c';ctx.fillRect(0,0,256,1024);
let seed=51;
for(let i=0;i<32000;i++){seed=(seed*1664525+1013904223)>>>0;const x=Math.floor(seed/4294967296*256);seed=(seed*1664525+1013904223)>>>0;const y=Math.floor(seed/4294967296*1024);ctx.fillStyle=i%2?'#ffffff08':'#00000020';ctx.fillRect(x,y,1,1);}
ctx.fillStyle='#6c7075';ctx.fillRect(25,0,1,1024);ctx.fillRect(230,0,1,1024);
ctx.globalCompositeOperation='destination-in';
const fade=ctx.createLinearGradient(0,0,0,1024);fade.addColorStop(0,'transparent');fade.addColorStop(.25,'#fff');fade.addColorStop(.75,'#fff');fade.addColorStop(1,'transparent');ctx.fillStyle=fade;ctx.fillRect(0,0,256,1024);
const roadTexture=new THREE.CanvasTexture(roadCanvas);roadTexture.colorSpace=THREE.SRGBColorSpace;roadTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
const road=new THREE.Mesh(new THREE.PlaneGeometry(4.6,24),new THREE.MeshStandardMaterial({map:roadTexture,color:0x101216,envMapIntensity:.05,transparent:true,roughness:1,metalness:0,depthWrite:false}));
road.rotation.x=-Math.PI/2;road.position.y=-.008;road.receiveShadow=true;scene.add(road);
new GLTFLoader().load(`${import.meta.env.BASE_URL}models/environment.glb`,gltf=>{
 const roomModel=gltf.scene;
 roomModel.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(roomModel);
 const size=bounds.getSize(new THREE.Vector3());
 roomModel.scale.multiplyScalar(40/Math.max(size.x,size.z));
 roomModel.updateMatrixWorld(true);
 bounds.setFromObject(roomModel);
 const center=bounds.getCenter(new THREE.Vector3());
 roomModel.position.x-=center.x;roomModel.position.z-=center.z;
 roomModel.traverse(o=>{if(o.isMesh){
   // These exported meshes are foliage and trunk; Object_6 is the architecture.
   if(o.name==='Object_4'||o.name==='Object_5'){o.visible=false;return;}
   o.receiveShadow=true;const source=o.material;const baked=source.map||source.emissiveMap;
   if(baked){o.material=new THREE.MeshBasicMaterial({map:baked,side:THREE.DoubleSide});}
 }});
 roomModel.updateMatrixWorld(true);
 const architecture=[];roomModel.traverse(o=>{if(o.isMesh&&o.visible)architecture.push(o);});
 const floorRay=new THREE.Raycaster(new THREE.Vector3(0,20,0),new THREE.Vector3(0,-1,0));
 const floorHit=floorRay.intersectObjects(architecture,false)[0];
 if(floorHit)roomModel.position.y-=floorHit.point.y;
 floor.position.y=.006;
 scene.add(roomModel);
 road.visible=false;
 canvas.dataset.environmentLoaded='true';
 loadState.room=1;loadState.roomReady=true;
},event=>{if(event.total)loadState.room=Math.max(loadState.room,event.loaded/event.total*.9);},error=>{console.error('Environment failed to load',error);failLoading('The room could not load. Please try again.');});
new GLTFLoader().load(`${import.meta.env.BASE_URL}models/car/scene.gltf`,gltf=>{
 const car=gltf.scene;
 car.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;const materials=Array.isArray(obj.material)?obj.material:[obj.material];materials.forEach(m=>{if(m.name==='silver'){m.color.set('#687f94');m.metalness=.8;m.roughness=.24;}if(m.name==='FC_051_shadow'){obj.visible=false;}if(m.name==='chrome.001'){m.color.set('#50575b');m.metalness=.8;} });}});
 car.updateMatrixWorld(true);
 const bounds=new THREE.Box3();
 const measure=()=>{bounds.makeEmpty();car.traverse(o=>{if(o.isMesh && o.visible){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});};
 measure();const size=bounds.getSize(new THREE.Vector3());
 car.scale.multiplyScalar(5.2/Math.max(size.x,size.y,size.z));car.updateMatrixWorld(true);
 measure();const center=bounds.getCenter(new THREE.Vector3());car.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
 scene.add(car);loadState.car=1;loadState.carReady=true;
 canvas.dataset.loaded='true';
},event=>{if(event.total)loadState.car=Math.max(loadState.car,event.loaded/event.total*.65);},error=>{console.error(error);failLoading('The car could not load. Please try again.');});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.querySelector('#explore').onclick=()=>{canvas.focus();setView();};
document.querySelector('#customize').onclick=()=>{canvas.focus();destination=null;wheelDistance=5.8;resumeAt=performance.now()+6000;};
canvas.addEventListener('keydown',()=>{resumeAt=performance.now()+6000;controls.autoRotate=false;});
canvas.addEventListener('keydown',e=>{if(['+','=','-'].includes(e.key)){e.preventDefault();destination=null;wheelDistance=THREE.MathUtils.clamp(camera.position.distanceTo(controls.target)*(e.key==='-'?1.15:.85),3,18);}if(e.key==='Home'){e.preventDefault();setView();}});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();destination=null;const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),e.key==='ArrowLeft'?-.12:.12);camera.position.copy(controls.target).add(offset);controls.update();});
const resize=new ResizeObserver(()=>{const {width,height}=canvas.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.setViewOffset(width,height,0,-height*.245,width,height);camera.updateProjectionMatrix();});resize.observe(canvas);
reduced.addEventListener('change',()=>{controls.enableDamping=!reduced.matches;if(reduced.matches){rotationEnabled=false;controls.autoRotate=false;motionButton.textContent='Play motion';motionButton.setAttribute('aria-pressed','false');}});
let last=performance.now();
let smoothProgress=0;
const orbitAxis=new THREE.Vector3(0,1,0);
renderer.setAnimationLoop(now=>{
 const delta=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;
 controls.autoRotate=rotationEnabled&&!interacting&&now>resumeAt&&!destination&&!story.open&&!document.body.classList.contains('is-loading');
 // Ease back into rotation instead of jumping to full speed after interaction.
 rotationSpeed=THREE.MathUtils.lerp(rotationSpeed,controls.autoRotate?1.05:0,1-Math.exp(-delta*2.5));
 controls.autoRotateSpeed=rotationSpeed;
 if(destination){camera.position.lerp(destination,1-Math.exp(-delta*5));if(camera.position.distanceTo(destination)<.005)destination=null;}
 if(wheelDistance!==null){const offset=camera.position.clone().sub(controls.target);const distance=reduced.matches?wheelDistance:THREE.MathUtils.lerp(offset.length(),wheelDistance,1-Math.exp(-delta*12));camera.position.copy(controls.target).add(offset.setLength(distance));if(Math.abs(distance-wheelDistance)<.002)wheelDistance=null;}
 const scrollTravel=Math.max(1,scrollScene.offsetHeight-hero.offsetHeight);
 const progress=reduced.matches?0:THREE.MathUtils.clamp(-scrollScene.getBoundingClientRect().top/scrollTravel,0,1);
 const previousProgress=smoothProgress;
 smoothProgress=THREE.MathUtils.lerp(smoothProgress,progress,1-Math.exp(-delta*5));
 // Apply only the scroll delta, preserving the user's orbit and manual zoom.
 if(!reduced.matches&&!interacting&&!destination&&!story.open){
   const offset=camera.position.clone().sub(controls.target);
   offset.applyAxisAngle(orbitAxis,(smoothProgress-previousProgress)*Math.PI*2);
   camera.position.copy(controls.target).add(offset);
 }
 const targetZoom=Math.min(.92,camera.aspect/.98)*(1+Math.sin(smoothProgress*Math.PI)*.12+smoothProgress*.04);
 camera.zoom=reduced.matches?targetZoom:THREE.MathUtils.lerp(camera.zoom,targetZoom,1-Math.exp(-delta*8));
 camera.updateProjectionMatrix();
 controls.update(delta);renderer.render(scene,camera);
 if(loadState.roomReady&&loadState.carReady)loadState.rendered=true;
});
window.addEventListener('pagehide',()=>{hero.removeEventListener('wheel',onWheel,true);roadTexture.dispose();renderer.setAnimationLoop(null);resize.disconnect();controls.dispose();scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});environment.dispose();renderer.dispose();},{once:true});
} catch(error){console.error(error);failLoading('Enable browser hardware acceleration to view the showroom, then try again.');}
