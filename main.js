import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

function main() {
    const canvas = document.querySelector('#c');
    // const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas,
        alpha: true,
      });

    const fov = 45;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();

    // Skybox
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
    './images/rural4k.png',
    () => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    });

    // Road Texture
    const planeSize = 40;
    const roadTextureLoader = new THREE.TextureLoader();
    const roadTexture = roadTextureLoader.load('./images/road.png');
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    roadTexture.repeat.set(repeats, repeats);
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: roadTexture,
        side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = Math.PI * -0.5;
    scene.add(plane);

    // Various Lights
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff0000, 1, 100);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // Cube with Texture
    const cubeTextureLoader = new THREE.TextureLoader();
    const cubeTexture = cubeTextureLoader.load('./images/lava.jpg');
    cubeTexture.colorSpace = THREE.SRGBColorSpace;
    const geometryBox = new THREE.BoxGeometry(1, 1, 1);
    const materialBox = new THREE.MeshBasicMaterial({ map: cubeTexture });
    const cube = new THREE.Mesh(geometryBox, materialBox);
    cube.position.set(-5, 2, -5);
    scene.add(cube);

    // Sphere
    const geometrySphere = new THREE.SphereGeometry(0.5, 16, 16);
    const materialSphere = new THREE.MeshBasicMaterial({ color: 0x78ff44 });
    const sphere = new THREE.Mesh(geometrySphere, materialSphere);
    sphere.position.set(0, 0.5, -5);
    scene.add(sphere);

    // Cylinder
    const geometryCylinder = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
    const materialCylinder = new THREE.MeshPhongMaterial({ color: 0x3498db });
    const cylinder = new THREE.Mesh(geometryCylinder, materialCylinder);
    cylinder.position.set(5, 1, -5);
    scene.add(cylinder);

    // Load textured 3D model
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./models/bus.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('./models/bus.obj', (root) => {
            scene.add(root);
            root.position.set(0, 0, 5);
        });
    });

    // Animation
    let mixer;
    const clock = new THREE.Clock();
    const animate = () => {
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    };

    // Animate rotation of the cube
    mixer = new THREE.AnimationMixer(cube);
    const rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1, 2], [
        0, 0, 0, 1,
        0.707, 0.707, 0, 0,
        0, 0, 0, 1
    ]);
    const clip = new THREE.AnimationClip('rotate', 3, [rotationKF]);
    const action = mixer.clipAction(clip);
    action.play();
    animate();

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
    }

    // camera controls
    class MinMaxGUIHelper {
        constructor(obj, minProp, maxProp, minDif) {
          this.obj = obj;
          this.minProp = minProp;
          this.maxProp = maxProp;
          this.minDif = minDif;
        }
        get min() {
          return this.obj[this.minProp];
        }
        set min(v) {
          this.obj[this.minProp] = v;
          this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
        }
        get max() {
          return this.obj[this.maxProp];
        }
        set max(v) {
          this.obj[this.maxProp] = v;
          this.min = this.min;  // this will call the min setter
        }
    }

    function updateCamera() {
        camera.updateProjectionMatrix();
      }
       
      const gui = new GUI();
      gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
      const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
      gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
      gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);

    function render() {
        resizeRendererToDisplaySize(renderer);
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
