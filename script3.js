let context,control,renderer,x=0;
var group = new THREE.Group();

var noise = new SimplexNoise();
var vizInit = function () {
  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  var fileLabel = document.querySelector("label.file");

  document.onload = function (e) {
    console.log(e);
    audio.play();
    play();
  };

  //AUDIO EFFECTS
  file.onchange = function () {
    fileLabel.classList.add("normal");
    audio.classList.add("active");
    var files = this.files;

    // get the audio file form the possible array of files, the user uploaded
    audio.src = URL.createObjectURL(files[0]);

    // load the file, and then play it - all using HTML5 audio element's API
    audio.load();
    audio.play();
    play();
  };


  function play() {
      
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    //Create context
    context = new AudioContext();
    var src = context.createMediaElementSource(audio);//create src inside context

    //create analyser
    var analyser = context.createAnalyser(); 
    src.connect(analyser);  //connect analyser node to the src
    analyser.connect(context.destination); // connect the destination node to the analyser
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // control = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);

    
    // PLANE TOP & BOTTOM
    var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
      color: "#826C7F",
      side: THREE.DoubleSide,
    //   wireframe: true,
    });

    // TOP
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);
    group.add(plane);

    // BOTTOM
    var plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -30, 0);
    group.add(plane2);

    // BALL in the middle
    var coneGeometry = new THREE.ConeGeometry(5, 5, 20);
    var lambertMaterial = new THREE.MeshPhongMaterial({
      color: "#EFCEFA",
      wireframe: true,
    });

    var ball = new THREE.Mesh(coneGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    var coneGeometry = new THREE.ConeGeometry(5, 5, 20);
    var lambertMaterial = new THREE.MeshPhongMaterial({
      color: "#EFCEFA",
      wireframe: true,
    });

    var ball2 = new THREE.Mesh(coneGeometry, lambertMaterial);
    ball2.position.set(50, 0, 0);
    group.add(ball2);

    var coneGeometry = new THREE.ConeGeometry(5, 5, 20);
    var lambertMaterial = new THREE.MeshPhongMaterial({
      color: "#EFCEFA",
      wireframe: true,
    });

    var ball3 = new THREE.Mesh(coneGeometry, lambertMaterial);
    ball3.position.set(-50, 0, 0);
    group.add(ball3);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 1;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);

    
    
    scene.add(group);

    document.getElementById("out").appendChild(renderer.domElement);

    window.addEventListener("resize", onWindowResize, false);

    render();

    function render() {
      analyser.getByteFrequencyData(dataArray);

    // slice the array into two halves
      var lowerHalfArray = dataArray.slice(0, dataArray.length / 2 - 1);
      var upperHalfArray = dataArray.slice(
        dataArray.length / 2 - 1,
        dataArray.length - 1
      );
    

      // do some basic reductions/normalisations
      var lowerMax = max(lowerHalfArray);
      var lowerAvg = avg(lowerHalfArray);
      var upperMax = max(upperHalfArray);
      var upperAvg = avg(upperHalfArray);

      var lowerMaxFr = lowerMax / lowerHalfArray.length;
      var lowerAvgFr = lowerAvg / lowerHalfArray.length;
      var upperMaxFr = upperMax / upperHalfArray.length;
      var upperAvgFr = upperAvg / upperHalfArray.length;

      // use the reduced values to modulate the 3d objects
      // these are the planar meshes above and below the sphere
      makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
      makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));

      // this modulates the sphere's shape.
      makeRoughBall(
        ball,
        modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
        modulate(upperAvgFr, 0, 1, 0, 4)
      );

      makeRoughBall(
        ball2,
        modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
        modulate(upperAvgFr, 0, 1, 0, 4)
      );
      makeRoughBall(
        ball3,
        modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
        modulate(upperAvgFr, 0, 1, 0, 4)
      );

   
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function makeRoughBall(mesh, bassFr, treFr) {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        var offset = mesh.geometry.parameters.radius;
        var amp = 7;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance =
          offset +
          bassFr +
          noise.noise3D(
            vertex.x + time * rf * 7,
            vertex.y + time * rf * 8,
            vertex.z + time * rf * 9
          ) *
            amp *
            treFr;
        vertex.multiplyScalar(distance);
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    function makeRoughGround(mesh, distortionFr) {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        var amp = 2;
        var time = Date.now();
        var distance =
          (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) +
            0) *
          distortionFr *
          amp;
        vertex.z = distance;
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
       if(x==1){
         group.rotation.y += 0.004;
     }
     
    }

    audio.play();
  }
};

// PRESS E & R TO ROTATE
let addListener = () => {
    document.addEventListener("keydown", keyListener);
  };
let keyListener = (event) => {
    let keyCode = event.keyCode;
    // E & R
    if (keyCode == 69) {
            x = 1;
    }if (keyCode == 82) {
        x = 0;
}
}

window.onload = () => {
    vizInit();
    addListener();
}

document.body.addEventListener("touchend", function (ev) {
  context.resume();
});

function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + fr * delta;
}

function avg(arr) {
  var total = arr.reduce(function (sum, b) {
    return sum + b;
  });
  return total / arr.length;
}

function max(arr) {
  return arr.reduce(function (a, b) {
    return Math.max(a, b);
  });
}
