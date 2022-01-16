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
    
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);

    // PLANE TOP & BOTTOM
    var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
      color: "grey",
      side: THREE.DoubleSide,
      wireframe: true,
    });

    // TOP
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = -0.5 * Math.PI;
    // plane.position.set(0, 30, 0);
    // group.add(plane);

    // BOTTOM
    var plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane2.rotation.x = -0.5 * Math.PI;
    // plane2.position.set(-50, -50, -50);
    group.add(plane2);

    // BALL in the middle
    // var heartgeo= new THREE.ShapeGeometry( heartShape );

    var torusGeometry = new THREE.TorusGeometry(10, 3, 16,100);
    var material = new THREE.MeshBasicMaterial( { color: '#016c8b' } );
    var ball = new THREE.Mesh(torusGeometry, material);
    ball.position.set(0, 0, 0);
    group.add(ball);

    var torusGeometry = new THREE.TorusGeometry(15, 3, 16,100);
    var material = new THREE.MeshBasicMaterial( { color: "#175981" } );
    var ball2 = new THREE.Mesh(torusGeometry, material);
    ball2.position.set(0, 0, 0);
    group.add(ball2);

    var torusGeometry = new THREE.TorusGeometry(20, 3, 16,100);
    var material = new THREE.MeshBasicMaterial( { color: '#004b90' } );
    var ball3 = new THREE.Mesh(torusGeometry, material);
    ball3.position.set(0, 0, 0);
    group.add(ball3);

    var torusGeometry = new THREE.TorusGeometry(25, 3, 16,100);
    var material = new THREE.MeshBasicMaterial( { color: '#003769' } );
    var ball4 = new THREE.Mesh(torusGeometry, material);
    ball4.position.set(0, 0, 0);
    group.add(ball4);




    var ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add(ambientLight);
    
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
      makeRoughBall(
        ball4,
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
        var amp = 0;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance =
          offset +
          bassFr +
          noise.noise3D(
            vertex.x + time * rf * 9,
            vertex.y + time * rf * 9,
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
        var amp = 10;
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
