var Filters = Filters || {};

// Space for your helper functions
// ----------- STUDENT CODE BEGIN ------------
function createRotationMatrixX(angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [1, 0, 0],
    [0, cos, -sin],
    [0, sin, cos]
  ];
}

function createRotationMatrixY(angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [cos, 0, sin],
    [0, 1, 0],
    [-sin, 0, cos]
  ];
}

function createRotationMatrixZ(angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [cos, -sin, 0],
    [sin, cos, 0],
    [0, 0, 1]
  ];
}

function cotangentWeightCalculation(v1, v2, mesh) {
  const neighbors1 = mesh.verticesOnVertex(v1)
  const neighbors2 = mesh.verticesOnVertex(v2)

  const commonNeighbors = []
  for (let neighbor of neighbors1) {
    if (neighbors2.includes(neighbor)) commonNeighbors.push(neighbor)
  }

  if (commonNeighbors.length !== 2) {
    return 0;
  }

  const [v3, v4] = commonNeighbors;
  const cotAlpha = cotangent(v1.position, v2.position, v3.position);
  const cotBeta = cotangent(v1.position, v2.position, v4.position);

  return cotAlpha + cotBeta
}

function cotangent(p1, p2, p3) {
  const u = new THREE.Vector3().subVectors(p1, p3);
  const v = new THREE.Vector3().subVectors(p2, p3);
  const dot = u.dot(v)
  const cross = new THREE.Vector3().crossVectors(u, v)
  const crossLength = cross.length()
  if (crossLength === 0) {
    return 0;
  }
  const cotangent = dot / Math.abs(crossLength)
  return cotangent;
}

function distanceTo(vertex1, vertex2) {
  const dx = vertex2.x - vertex1.x;
  const dy = vertex2.y - vertex1.y;
  const dz = vertex2.z - vertex1.z;

  // Calculate the Euclidean distance
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return distance;
}

// Function to compute principal curvatures for a vertex using Euler operations
function computePrincipalCurvatures(vertex, mesh) {
  const edgeLengths = [];
  const dihedralAngles = [];

  // Iterate over the halfedges incident to the vertex
  let startHalfedge = vertex.halfedge;
  let halfedge = startHalfedge;
  const visitedHalfedges = new Set();
  
  while (halfedge && !visitedHalfedges.has(halfedge)) {
    visitedHalfedges.add(halfedge);

    // Access the start and end vertices of the edge
    const v1 = halfedge.vertex.position;
    const v2 = halfedge.opposite.vertex.position;

    // Compute the length of the edge
    const edgeLength = distanceTo(v1, v2);
    edgeLengths.push(edgeLength);

    // Compute the dihedral angle for adjacent faces
    const dihedralAngle = computeDihedralAngle(halfedge, mesh);
    dihedralAngles.push(dihedralAngle);

    // Move to the next halfedge incident to the vertex
    halfedge = halfedge.opposite ? halfedge.opposite.next : null;

    // If we return to the starting halfedge, we should stop
    if (halfedge === startHalfedge) {
      break;
    }
  }

  // Estimate principal curvatures using edge lengths and dihedral angles
  const principalCurvatures = estimateCurvature(edgeLengths, dihedralAngles);

  // Return the computed principal curvatures
  return principalCurvatures;
}

// Function to compute the dihedral angle between adjacent faces incident to an edge
function computeDihedralAngle(edge, mesh) {
  // Find the two adjacent faces sharing the edge
  const face1 = edge.face;
  const face2 = edge.opposite.face;

  // Assuming the mesh is triangular, get the normal vectors of the faces
  const normal1 = mesh.calculateFaceNormal(face1);
  const normal2 = mesh.calculateFaceNormal(face2);

  // Compute the angle between the normal vectors using dot product
  const dotProduct = normal1.dot(normal2);
  const angle = Math.acos(Math.min(Math.max(dotProduct, -1), 1)); // Ensure the value is within [-1, 1] for safe acos

  return angle;
}

// Function to estimate principal curvatures using edge lengths and dihedral angles
function estimateCurvature(edgeLengths, dihedralAngles) {
  const meanEdgeLength = edgeLengths.reduce((acc, val) => acc + val, 0) / edgeLengths.length;
  const meanDihedralAngle = dihedralAngles.reduce((acc, val) => acc + val, 0) / dihedralAngles.length;

  // Estimate curvature based on linear and quadratic relationships
  const linearTerm = 1 / meanEdgeLength; // Linear term based on inverse of mean edge length
  const quadraticTerm = Math.pow(meanDihedralAngle, 2); // Quadratic term based on squared mean dihedral angle

  // Combine linear and quadratic terms to estimate curvature
  const curvature = linearTerm + quadraticTerm;

  return curvature;
}

function mapCurvatureToColor(curvature) {
  const lowCurvatureColor = [0, 255, 255]; // Blue
  const highCurvatureColor = [255, 0, 255]; // Red

  const minCurvature = -1; // Minimum possible curvature value
  const maxCurvature = 1; // Maximum possible curvature value

  // Map the curvature value to a color within the defined range
  const mappedColor = [];

  for (let i = 0; i < 3; i++) {
    const lowColorComponent = lowCurvatureColor[i];
    const highColorComponent = highCurvatureColor[i];
    
    // Linearly interpolate between low and high color components based on curvature value
    const colorComponent = lowColorComponent + (curvature - minCurvature) * (highColorComponent - lowColorComponent) / (maxCurvature - minCurvature);
    
    // Ensure the color component is within the valid range [0, 255]
    mappedColor[i] = Math.min(255, Math.max(0, Math.round(colorComponent)));
  }

  return mappedColor;
}

function getCommonFace(v1, v2, mesh) {
  let face1 = mesh.facesOnVertex(v1);
  let face2 = mesh.facesOnVertex(v2);

  for (let face of face2) {
    if (face1.includes(face)) return face;
  }
}
// ----------- STUDENT CODE END ------------

// Translate all selected vertices in the mesh by the given x,y,z offsets.
Filters.translation = function(mesh, x, y, z) {
  const t = new THREE.Vector3(x, y, z);

  const verts = mesh.getModifiableVertices();

  const n_vertices = verts.length;
  for (let i = 0; i < n_vertices; ++i) {
    verts[i].position.add(t);
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Given x,y,z, the desired rotation around each axis, in radians,
// apply this rotation to all selected vertices in the mesh.
Filters.rotation = function(mesh, x, y, z) {
  const verts = mesh.getModifiableVertices();

  // ----------- STUDENT CODE BEGIN ------------
  function applyMatrixToVertex(vertex, matrix) {
    let x = vertex.x
    let y = vertex.y
    let z = vertex.z
    return new THREE.Vector3(
      x * matrix[0][0] + y * matrix[0][1] + z * matrix[0][2],
      x * matrix[1][0] + y * matrix[1][1] + z * matrix[1][2],
      x * matrix[2][0] + y * matrix[2][1] + z * matrix[2][2]
    )
  }
  const rotationMatrixX = createRotationMatrixX(x);
  const rotationMatrixY = createRotationMatrixY(y);
  const rotationMatrixZ = createRotationMatrixZ(z);
  for (let i = 0; i < verts.length; i++) {
    let vertex = verts[i].position.clone()

    vertex = applyMatrixToVertex(vertex, rotationMatrixX);
    vertex = applyMatrixToVertex(vertex, rotationMatrixY);
    vertex = applyMatrixToVertex(vertex, rotationMatrixZ);

    verts[i].position.copy(vertex)
  }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Rotation is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Uniformly scale the position of all selected vertices in the mesh
// by the provided scale factor s
Filters.scale = function(mesh, s) {
  const verts = mesh.getModifiableVertices();

  // ----------- STUDENT CODE BEGIN ------------
  const t = new THREE.Vector3(s, s, s);
  for (let i = 0; i < verts.length; i++) {
    verts[i].position.multiply(t)
  }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Scaling is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// estimate the per-vertex gaussian vurvature of the mesh at each vertex.
// set that vertex's color to some value based on its curvature value.
// (the precise mapping of curvature to color is left to you)
Filters.curvature = function(mesh) {
  // ----------- STUDENT CODE BEGIN ------------
  const vertices = mesh.getModifiableVertices();
  for (let vertex of vertices) {
    const principalCurvatures = computePrincipalCurvatures(vertex, mesh)
    const gaussianCurvature = principalCurvatures[0] * principalCurvatures[1]
    const vertexColor = mapCurvatureToColor(gaussianCurvature)
    vertex.color = vertexColor
  }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Curvature is not implemented yet");
};

// Apply a random offset to each selected vertex in the direction of its normal
// scale the random offset by the provided factor and by
// the average length of edges at that vertex
Filters.noise = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();

  // ----------- STUDENT CODE BEGIN ------------
  for (let i = 0; i < verts.length; i++) {
    const avgEdgeLength = mesh.averageEdgeLength(verts[i])
    let randomValue = Math.random() * 2 - 1 // Generate a random value in the range [-1, 1)
    let offset = verts[i].normal.clone().multiplyScalar(randomValue * avgEdgeLength * factor)
    verts[i].position.add(offset)
  }
  mesh.updateVertexNormals()
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Noise is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Smooth the mesh using the specified weighting scheme.
// In the standard case, this is done using uniform Laplacian smoothing,
// by moving each vertex towards the average position of its neighbors.
//
// Arguments:
//  - mesh: the mesh to smooth
//  - iter: the number of iterations of smoothing to apply
//  - delta: a scaling factor for the amount of smoothing
//  - curvFlow: a bool. if true, use cotangent weights instead of uniform (requires triangular mesh)
//  - scaleDep: a bool. if true, scale offsets differently for each vertex (see spec.)
//  - implicit: a bool. if true, perform implicit smoothing (see spec.)
//
// Note that the reference solution calls a giant utility function so the line
// count is not terribly representative of the true solution
//
// For implicit, you will want to compute I - M*L*delta, where I is the identity
// matrix, M is a diagonal "mass" matrix, and L is a Laplacian matrix. Then
// you will want to call math.lup() on your result in order to decompose the
// matrix. Finally, call math.lusolve() to compute the X,Y, and Z positions of
// vertices. Note that the decomposition step allows for fast solving multiple
// times. It would be possible to replace a few of these steps with simple matrix
// inversion; however, matrix inversion is far slower and less numerically stable
//
Filters.smooth = function(mesh, iter, delta, curvFlow, scaleDep, implicit) {
  const verts = mesh.getModifiableVertices();

  // ----------- STUDENT CODE BEGIN ------------
  const n = verts.length
  for (let i = 0; i < iter; i++) {
    if (implicit) {
      // Implicit smoothing setup
      const M = new Array(n).fill(0).map(() => 1);  // Assuming uniform mass
      const L = new Array(n).fill().map(() => new Array(n).fill(0));
      const I = new Array(n).fill().map((_, idx) => {
        const row = new Array(n).fill(0);
        row[idx] = 1;
        return row;
      });

      for (let j = 0; j < n; j++) {
        let neighbors = mesh.verticesOnVertex(verts[j]);
        let weightSum = 0;
        
        for (let neighbor of neighbors) {
          const k = verts.indexOf(neighbor);
          L[j][k] = -1;
          weightSum += 1;
        }
        L[j][j] = weightSum;

        const A = new Array(n).fill().map(() => new Array(n).fill(0));
        for (let k = 0; k < n; k++) {
          A[j][k] = I[j][k] - delta * M[j] * L[j][k];
        }
      }
      
      // Step 3: Decompose A using LU decomposition
      const { L: Lmatrix, U: Umatrix, P: Pmatrix } = math.lup(A);

      // Step 4: Solve for new positions using LU decomposition
      for (let axis of ['x', 'y', 'z']) {
        const b = verts.map(v => v.position[axis]);
        const Pb = math.multiply(Pmatrix, b);
        const y = math.lsolve(Lmatrix, Pb);
        const newPos = math.usolve(Umatrix, y);

        for (let j = 0; j < n; j++) {
          verts[j].position[axis] = newPos[j];
        }
      }
    } else {
      // Explicit smoothing
      for (let j = 0; j < verts.length; j++) {
        let neighbors = mesh.verticesOnVertex(verts[j]);
        let averagePosition = new THREE.Vector3(0, 0, 0);
        let weight = 0;
        let areaSum = 0;

        if (scaleDep) {
          let adjacent = mesh.facesOnVertex(verts[j]);
          for (let face of adjacent) {
            let area = mesh.calculateFaceArea(face);
            areaSum += area;
          }
        }

        if (!curvFlow) {
          for (let neighbor of neighbors) {
            averagePosition.add(neighbor.position);
          }
          weight = neighbors.length;
        } else {
          for (let neighbor of neighbors) {
            let w = cotangentWeightCalculation(verts[j], neighbor, mesh);
            averagePosition.addScaledVector(neighbor.position, w);
            weight += w;
          }
        }

        averagePosition.divideScalar(weight);
        let direction = new THREE.Vector3(
          averagePosition.x - verts[j].position.x,
          averagePosition.y - verts[j].position.y,
          averagePosition.z - verts[j].position.z
        );

        if (scaleDep) {
          let adjacent = mesh.facesOnVertex(verts[j]);
          const A = areaSum / adjacent.length;
          direction.multiplyScalar(delta * (areaSum / A));
        } else {
          direction.multiplyScalar(delta);
        }

        verts[j].position.copy(verts[j].position.clone().add(direction));
      }
    }
  }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Smooth is not implemented yet");
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Sharpen the mesh by moving selected vertices away from the average position
// of their neighbors (i.e. Laplacian smoothing in the negative direction)
Filters.sharpen = function(mesh, iter, delta) {
  const verts = mesh.getModifiableVertices();

  // ----------- STUDENT CODE BEGIN ------------
  for (let i = 0; i < iter; i++) {
    for (let j = 0; j < verts.length; j++) {
      let neighbors = mesh.verticesOnVertex(verts[j])

      let averagePosition = new THREE.Vector3(0, 0, 0)
      for (let neighbor of neighbors) {
        averagePosition.add(neighbor.position)
      }
      averagePosition.divideScalar(neighbors.length)
      let direction = new THREE.Vector3(
        verts[j].position.x - averagePosition.x,
        verts[j].position.y - averagePosition.y,
        verts[j].position.z - averagePosition.z
      ).multiplyScalar(delta)

      verts[j].position.copy(verts[j].position.clone().add(direction))
    }
  }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Sharpen is not implemented yet");
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Move every selected vertex along its normal direction
// Scale the amount by the provided factor and average edge length at that vertex
Filters.inflate = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();

  // ----------- STUDENT CODE BEGIN ------------
  for (let i = 0; i < verts.length; i++) {     
    verts[i].position.add(new THREE.Vector3(verts[i].normal.x * factor,verts[i].normal.y * factor,verts[i].normal.z * factor))
  }
  mesh.updateVertexNormals()
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Inflate is not implemented yet");
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// rotate selected vertices around the Y axis by an amount
// proportional to its Y value times the scale factor.
Filters.twist = function(mesh, factor) {
  const verts = mesh.getModifiableVertices();

  // ----------- STUDENT CODE BEGIN ------------
  for (let i = 0; i < verts.length; i++) {
    let vertex = verts[i].position
    const matrix = createRotationMatrixY(vertex.y * factor)

    verts[i].position = new THREE.Vector3(
        vertex.x * matrix[0][0] + vertex.y * matrix[0][1] + vertex.z * matrix[0][2],
        vertex.x * matrix[1][0] + vertex.y * matrix[1][1] + vertex.z * matrix[1][2],
        vertex.x * matrix[2][0] + vertex.y * matrix[2][1] + vertex.z * matrix[2][2]
      )
  }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Twist is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// warp a mesh using a nonlinear mapping of your choice
Filters.wacky = function(mesh, factor) {
  // ----------- STUDENT CODE BEGIN ------------
  const verts = mesh.getModifiableVertices()
  for (let i = 0; i < verts.length; i++) {
    verts[i].position.multiply(new THREE.Vector3(Math.cos(factor), Math.sin(factor), 1))
  }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Wacky is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Convert the selected faces from arbitrary polygons into all triangles
Filters.triangulate = function(mesh) {
  const faces = mesh.getModifiableFaces();

  // ----------- STUDENT CODE BEGIN ------------
  for(let face of faces)
    {   
        let verts = mesh.verticesOnFace(face);
        for(let i in verts)
          if(i > 1 && i < verts.length - 1)
              mesh.splitFaceMakeEdge(face, verts[0], verts[i]);
    }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("triangulate is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for splitEdgeMakeVert in mesh.js
Filters.splitEdge = function(mesh) {
  const verts = mesh.getSelectedVertices();

  if (verts.length === 2) {
    mesh.splitEdgeMakeVert(verts[0], verts[1], 0.5);
  } else {
    console.log("ERROR: to use split edge, select exactly 2 adjacent vertices");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for joinEdgeKillVert in mesh.js
Filters.joinEdges = function(mesh) {
  const verts = mesh.getSelectedVertices();

  if (verts.length === 3) {
    let v0 = verts[0],
      v1 = verts[1],
      v2 = verts[2];

    const he01 = mesh.edgeBetweenVertices(v0, v1);
    const he12 = mesh.edgeBetweenVertices(v1, v2);

    if (he01) {
      if (he12) {
        mesh.joinEdgeKillVert(verts[0], verts[1], verts[2]);
      } else {
        mesh.joinEdgeKillVert(verts[1], verts[0], verts[2]);
      }
    } else {
      if (he12) {
        mesh.joinEdgeKillVert(verts[0], verts[2], verts[1]);
      } else {
        console.log(
          "ERROR: to use join edge, select exactly 3 vertices such that one only has edges to the other two"
        );
      }
    }
  } else {
    console.log("ERROR: to use join edge, select exactly 3 vertices");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for splitFaceMakeEdge in mesh.js
Filters.splitFace = function(mesh) {
  const verts = mesh.getSelectedVertices();
  const faces = mesh.getModifiableFaces();

  if (verts.length === 2 && faces.length === 1) {
    mesh.splitFaceMakeEdge(faces[0], verts[0], verts[1]);
  } else {
    console.log("ERROR: to use split face, select exactly 1 face and 2 nonadjacent vertices on it");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// wrapper for joinFaceKillEdge in mesh.js
Filters.joinFaces = function(mesh) {
  const verts = mesh.getSelectedVertices();
  const faces = mesh.getModifiableFaces();

  if (verts.length === 2 && faces.length === 2) {
    mesh.joinFaceKillEdge(faces[0], faces[1], verts[0], verts[1]);
  } else {
    console.log(
      "ERROR: to use split face, select exactly 2 adjacent faces the 2 vertices between them"
    );
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// extrude the selected faces from the mesh in the direction of their normal
// vector, scaled by the provided factor.
// See the spec for more detail.
Filters.extrude = function(mesh, factor) {
  const _faces = mesh.getModifiableFaces();

  // ----------- STUDENT CODE BEGIN ------------
  let faces = [..._faces];
  for(let face of faces)
    {
      let halfedges = mesh.edgesOnFace(face);
      console.log(halfedges)
      let new_verts = [];
      
      for(let i=0; i < halfedges.length; i++)
      {
        let new_vert = mesh.splitEdgeMakeVert(halfedges[i].vertex,
        halfedges[i].opposite.vertex, 0);
        
        let adj_face = new_vert.halfedge.opposite.face;
        
        mesh.splitFaceMakeEdge(adj_face, new_vert.halfedge.vertex, 
        new_vert.halfedge.opposite.next.vertex);
        new_verts.push(new_vert);
      }
      
      for(let i = 0; i < new_verts.length; i++)
      {
        mesh.splitFaceMakeEdge(face, new_verts[i], new_verts[(i + 1) % new_verts.length]);
        
        mesh.joinFaceKillEdge(
          new_verts[i].halfedge.opposite.next.next.opposite.face,
          new_verts[i].halfedge.opposite.face,
          new_verts[i].halfedge.opposite.next.vertex,
          new_verts[i].halfedge.vertex
          );
      }
        
      console.log(faces.length);
      for(let new_vert of new_verts)
      {
          new_vert.position.addScaledVector(face.normal.normalize(), factor);
      }
    }
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Extrude is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Truncate the selected vertices of the mesh by "snipping off" corners
// and replacing them with faces. factor specifies the size of the truncation.
// See the spec for more detail.
Filters.truncate = function(mesh, factor) {
  const _verts = mesh.getModifiableVertices(); 
  let verts = [..._verts];
  // ----------- STUDENT CODE BEGIN ------------
  let vert_positons = [];
  for(let vertex of verts)
  {
    vert_positons.push(vertex.position.clone());
  }

  let vertex_movement_list = [];

  for(let i=0; i < verts.length; i++)
  {
      let old_neighbors = mesh.verticesOnVertex(verts[i]);
      for(let j=0; j < old_neighbors.length - 1; j++)
      {
        mesh.setSelectedVertices([verts[i].id, old_neighbors[j].id]);
        this.splitEdge(mesh);
      }

      let new_neighbors = new Set(mesh.verticesOnVertex(verts[i]));

      let left_out_old_neighbor = old_neighbors.filter(x => new_neighbors.has(x));
      let old_neighbors_set = new Set(old_neighbors);
      let newly_add_neighbors = [...new_neighbors].filter(x => !old_neighbors_set.has(x));

    
      for(let j=0; j<newly_add_neighbors.length; j++) 
      {
        newly_add_neighbors[j].position.set( verts[i].position.x, 
                                             verts[i].position.y, 
                                             verts[i].position.z);

        if(newly_add_neighbors[j].halfedge.vertex.id === verts[i].id)
        {
          vertex_movement_list.push([newly_add_neighbors[j], 
                      newly_add_neighbors[j].halfedge.opposite.next.vertex.position.clone()
                          .sub(newly_add_neighbors[j].position)]);
        }

        else
        {
          vertex_movement_list.push([newly_add_neighbors[j],
                                    newly_add_neighbors[j].halfedge.vertex.position.clone()
                                        .sub( newly_add_neighbors[j].position)]);

        }
      }

      let halfedge_1 = mesh.edgeBetweenVertices(verts[i], newly_add_neighbors[0]);
      let halfedge_2 = mesh.edgeBetweenVertices(verts[i], newly_add_neighbors[1]);
      
      let faces_on_he1 = new Set([halfedge_1.face, halfedge_1.opposite.face]);
      let faces_on_he2 = new Set([halfedge_2.face, halfedge_2.opposite.face]);

      let common_face = [...faces_on_he1].filter(x=>faces_on_he2.has(x));

      mesh.setSelectedFaces([common_face[0].id]);
      mesh.setSelectedVertices([newly_add_neighbors[0].id, newly_add_neighbors[1].id]);
      this.splitFace(mesh);

      let direction_to_move = left_out_old_neighbor[0].position.clone().sub(verts[i].position);

      vert_positons[i].addScaledVector(direction_to_move, factor);
  }

  for(let [v, dir] of vertex_movement_list)
  {
    v.position.addScaledVector( dir, factor);
  }
  for(let i=0; i < verts.length; i++)
  {
    verts[i].position.set(vert_positons[i].x,
                      vert_positons[i].y,
                      vert_positons[i].z);
  }
  mesh.setSelectedFaces([]);
  mesh.setSelectedVertices([]);
  // ----------- STUDENT CODE END ------------
  //   Gui.alertOnce("Truncate is not implemented yet");
  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Apply the bevel operation to the mesh, scaling the degree of bevelling by factor
Filters.bevel = function ( mesh, factor ) {

    var verts = mesh.getModifiableVertices();

    // ----------- STUDENT CODE BEGIN ------------
    // Store original vertices and their truncated counterparts
    this.truncate(mesh, factor);
    let _faces = mesh.getModifiableFaces();

    _faces = [..._faces]
    let faces = [];
    for(let face of _faces)
    {
      if(mesh.verticesOnFace(face).length == 3)
      {
        faces.push(face);
      }
    }
    
    let new_verts_face = [];
    for(let face of faces)
    {
      let halfedges = mesh.edgesOnFace(face);
      for(let he of halfedges)
      {
        new_verts_face.push([mesh.splitEdgeMakeVert(he.vertex, he.opposite.vertex, .5), he.opposite.face]);
      }
    }

    let remove_edge_set = new Set();
    
    for(let i = 0; i < new_verts_face.length; i++)
    {
      mesh.splitFaceMakeEdge(
        new_verts_face[i][1],
        new_verts_face[i][0], 
        new_verts_face[i][0].halfedge.opposite.next.next.next.vertex
      );

      remove_edge_set.add(mesh.edgeBetweenVertices(
        new_verts_face[i][0].halfedge.opposite.next.vertex,
        new_verts_face[i][0].halfedge.opposite.next.next.vertex)
      );
    }

    for(let edge of remove_edge_set) {
      let v1 = edge.vertex, v2 = edge.opposite.vertex;
      mesh.joinFaceKillEdge(edge.face, edge.opposite.face, v1, v2);
      mesh.joinEdgeKillVert(v1.halfedge.vertex, v1, v1.halfedge.opposite.next.vertex)
    }
  }

// Split the longest edges in the mesh into shorter edges.
// factor is a float in [0,1]. it tells the proportion
// of the total number of edges in the mesh that should be split.
Filters.splitLong = function(mesh, factor) {
  // ----------- STUDENT CODE BEGIN ------------
  let split_count = 0;
  let total_edges = 0;

  const _faces = mesh.getModifiableFaces();
  let faces = [..._faces];
  for(let face of faces)
  {
    total_edges += mesh.edgesOnFace(face).length;
  }
  total_edges /= 2;
  do{
    if(factor == 0)
      break;
    
    let max_half_edge = null, face_1_corner=null, face_2_corner=null;
    let max_half_edge_length=0;

    for(let face of faces)
    {
      let halfedges = mesh.edgesOnFace(face);
      for(let he of halfedges)
      {
        let cur_edge_len = he.vertex.position.clone().sub(he.opposite.vertex.position).length()

        if(max_half_edge_length < cur_edge_len)
        {
          max_half_edge_length = cur_edge_len;
          max_half_edge = he;
          face_1_corner = he.next.vertex;
          face_2_corner = he.opposite.next.vertex;
        }
      }
    }

    let new_vert = mesh.splitEdgeMakeVert(max_half_edge.vertex, max_half_edge.opposite.vertex, .5);
    mesh.splitFaceMakeEdge(max_half_edge.face, new_vert, face_1_corner);
    mesh.splitFaceMakeEdge(max_half_edge.opposite.face, new_vert, face_2_corner);
    split_count++;

    faces = [...mesh.getModifiableFaces()];

  }while(parseInt(factor * total_edges) > split_count);
  // ----------- STUDENT CODE END ------------
  //Gui.alertOnce("Split Long Edges is not implemented yet");

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Triangulate a mesh, and apply triangular subdivision to its faces.
// Repeat for the specified number of levels.
Filters.triSubdiv = function(mesh, levels) {
  Filters.triangulate(mesh);

  for (let l = 0; l < levels; l++) {
    const _faces = mesh.getModifiableFaces();
    // ----------- STUDENT CODE BEGIN ------------
    let faces = [..._faces];
    let face_old_edges_dest = []
    for(let face of faces)
    {
      halfedges = mesh.edgesOnFace(face);
      let old_edges_dest = [];
      for(let halfedge of halfedges)
      {
        old_edges_dest.push([halfedge, halfedge.vertex.position.clone()]);
      }
      face_old_edges_dest.push(old_edges_dest);
    }
    let new_faces = [];
    for(let i=0; i<face_old_edges_dest.length; i++)
    {
      let new_verts = [];
      for(let [he, v] of face_old_edges_dest[i])
      {
        let temp = he.vertex.position.clone().sub(v);
        if(temp.x==0 && temp.y==0 && temp.z==0)
        {
          let new_vert = mesh.splitEdgeMakeVert(he.vertex, he.opposite.vertex, .5);
  
          new_verts.push(new_vert);
        }
        else{
          new_verts.push(he.vertex)
        }
      }

      for(let v=0; v<new_verts.length; v++)
      {
        new_faces.push(mesh.splitFaceMakeEdge(faces[i], new_verts[v], new_verts[(v+1)%new_verts.length]));
      }
    }

    let to_select_faces = [];
    for(let face of faces)
    {
      to_select_faces.push(face.id);
    }

    for(let face of new_faces)
    {
      to_select_faces.push(face.id);
    }

    mesh.setSelectedFaces(to_select_faces);

    if(l+1 == levels)
    {
      mesh.setSelectedFaces([]);
    }
    // ----------- STUDENT CODE END ------------
    //Gui.alertOnce("Triangle subdivide is not implemented yet");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Triangulate the mesh and apply loop subdivision to the faces
// repeat for the specified number of levels.
Filters.loop = function(mesh, levels) {
  Filters.triangulate(mesh);
  for(let l=0; l < levels; l++)
  {
    const _faces = mesh.getModifiableFaces();
    // ----------- STUDENT CODE BEGIN ------------
    let faces = [..._faces];
    let old_mesh = new Mesh();
    old_mesh.copy(mesh);

    let old_verts = old_mesh.getModifiableVertices();
    let old_verts_list = [];
    for(let old_vert of old_verts)
    {
        old_verts_list.push(null);
    }

    for(let old_vert of old_verts)
    {
        old_verts_list[old_vert.id] = old_vert;
    }

    let face_old_edges_dest = [];
    for(let face of faces)
    {
        halfedges = mesh.edgesOnFace(face);
        let old_edges_dest = [];
        for(let halfedge of halfedges)
        {
            old_edges_dest.push([halfedge, halfedge.vertex.position.clone()]);
        }
        face_old_edges_dest.push(old_edges_dest);
    }

    let new_faces = [];
    for(let i=0; i<face_old_edges_dest.length; i++)
    {
        let new_verts = [];
        for(let [he, v] of face_old_edges_dest[i])
        {
            let temp = he.vertex.position.clone().sub(v);
            if(temp.x==0 && temp.y==0 && temp.z==0)
            {
                let new_vert = mesh.splitEdgeMakeVert(he.vertex, he.opposite.vertex, .5);
                

                let old_mesh_edge = old_mesh.edgeBetweenVertices(
                                                        old_verts[new_vert.halfedge.vertex.id],
                                                        old_verts[new_vert.halfedge.opposite.next.vertex.id]);
                let lower_wt_vert1 = old_mesh_edge.next.vertex;
                let lower_wt_vert2 = old_mesh_edge.opposite.next.vertex;
                let higher_wt_vert1 = old_verts[new_vert.halfedge.vertex.id];
                let higher_wt_vert2 = old_verts[new_vert.halfedge.opposite.next.vertex.id];

                let higher_sum = higher_wt_vert1.position.clone().multiplyScalar(3/8).add(
                    higher_wt_vert2.position.clone().multiplyScalar(3/8)
                );

                let lower_sum = lower_wt_vert1.position.clone().multiplyScalar(1/8).add(
                    lower_wt_vert2.position.clone().multiplyScalar(1/8)
                );
                let _new_vert_position = lower_sum.add(higher_sum);

                new_vert.position.set(_new_vert_position.x,
                                    _new_vert_position.y,
                                    _new_vert_position.z);

                new_verts.push(new_vert);
            }
            else{
                new_verts.push(he.vertex)
            }
        }

        for(let v=0; v<new_verts.length; v++)
        {
          new_faces.push(mesh.splitFaceMakeEdge(faces[i], new_verts[v], new_verts[(v+1)%new_verts.length]));
        }
    }

    old_verts = old_mesh.getModifiableVertices();

    let new_mesh_verts = mesh.getModifiableVertices();
    
    for(let i=0; i < old_verts.length; i++)
    {
        let neighbors = mesh.verticesOnVertex(old_verts[i]);
        
        let beta = 3/16;
        if(neighbors.length > 3)
        {
            beta *= 2/neighbors.length;
        }   

        let _new_position = new THREE.Vector3();
        for(let neighbor of neighbors)
        {
            _new_position.add(neighbor.position.clone().multiplyScalar(beta));
        }

        _new_position.add(old_verts[i].position.clone().multiplyScalar(1 - beta * neighbors.length));

        new_mesh_verts[i].position.set(_new_position.x,
                                        _new_position.y,
                                        _new_position.z);
      }
    // ----------- STUDENT CODE END ------------
    //Gui.alertOnce("Triangle subdivide is not implemented yet");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Requires a quad mesh. Apply quad subdivision to the faces of the mesh.
// Repeat for the specified number of levels.
Filters.quadSubdiv = function(mesh, levels) {
  for (let l = 0; l < levels; l++) {
    const faces = mesh.getModifiableFaces();
    // ----------- STUDENT CODE BEGIN ------------
    const newFaces = [];
    const newVertices = [];

    for (let face of faces) {
      //console.log(face)
      if (face.halfedge != undefined) {
        console.log(face)
        const verts = mesh.verticesOnFace(face)
        console.log(verts)

        // Assume que a face é um quad
        if (verts.length !== 4) continue;

        const v0 = verts[0].position;
        const v1 = verts[1].position;
        const v2 = verts[2].position;
        const v3 = verts[3].position;

        // Calcula os pontos médios das arestas
        const m01 = new THREE.Vector3().addVectors(v0, v1).multiplyScalar(0.5);
        const m12 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        const m23 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5);
        const m30 = new THREE.Vector3().addVectors(v3, v0).multiplyScalar(0.5);

        // Calcula o ponto central da face
        const center = new THREE.Vector3().addVectors(v0, v2).multiplyScalar(0.5);

        // Adiciona novos vértices à malha
        const mv01 = mesh.addVertex(m01);
        const mv12 = mesh.addVertex(m12);
        const mv23 = mesh.addVertex(m23);
        const mv30 = mesh.addVertex(m30);
        const mvCenter = mesh.addVertex(center);

        // Cria novas faces (quads) a partir dos novos vértices
        newFaces.push(mesh.addFace([verts[0], mv01, mvCenter, mv30]));
        newFaces.push(mesh.addFace([mv01, verts[1], mv12, mvCenter]));
        newFaces.push(mesh.addFace([mvCenter, mv12, verts[2], mv23]));
        newFaces.push(mesh.addFace([mv30, mvCenter, mv23, verts[3]]));

        // Armazena os novos vértices para referência
        newVertices.push(mv01, mv12, mv23, mv30, mvCenter);
      }
    }
    // Atualiza a lista de faces da malha
    mesh.setSelectedFaces(newFaces);
    // ----------- STUDENT CODE END ------------
    //Gui.alertOnce("Quad subdivide is not implemented yet");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// Apply catmull clark subdivision to the faces of the mesh.
// Repeat for the specified number of levels.
Filters.catmullClark = function(mesh, levels) {
  for (let l = 0; l < levels; l++) {

    // ----------- STUDENT CODE BEGIN ------------
    const oldVertices = mesh.getModifiableVertices();
    const oldFaces = mesh.getModifiableFaces();

    // Containers for new vertices, edges and faces
    const facePoints = [];
    const edgePoints = new Map();
    const vertexPoints = oldVertices.map(v => new THREE.Vector3());
    
    // 1. Compute face points
    for (let face of oldFaces) {
      const verts = mesh.facesOnVertex(face);
      const facePoint = new THREE.Vector3();
      
      for (let v of verts) {
        facePoint.add(v.position);
      }
      facePoint.divideScalar(verts.length);
      facePoints.push(facePoint);
    }

    // 2. Compute edge points and update vertex points
    const edgeMidpoints = new Map();

    for (let face of oldFaces) {
      const verts = mesh.facesOnVertex(face);
      const n = verts.length;

      for (let i = 0; i < n; i++) {
        const v1 = verts[i];
        const v2 = verts[(i + 1) % n];
        const edgeKey = v1.id < v2.id ? `${v1.id}-${v2.id}` : `${v2.id}-${v1.id}`;

        if (!edgeMidpoints.has(edgeKey)) {
          const edgePoint = new THREE.Vector3().addVectors(v1.position, v2.position).multiplyScalar(0.5);
          edgeMidpoints.set(edgeKey, edgePoint);
          edgePoints.set(edgeKey, edgePoint);

          // Average the face points
          const adjacentFaces = mesh.getAdjacentFaces(v1, v2);
          for (let face of adjacentFaces) {
            edgePoints.get(edgeKey).add(facePoints[oldFaces.indexOf(face)]);
          }
          edgePoints.get(edgeKey).divideScalar(adjacentFaces.length + 2);
        }
      }
    }

    // Update vertex points
    for (let i = 0; i < oldVertices.length; i++) {
      const vertex = oldVertices[i];
      const faces = mesh.getModifiableFaces()
      const F = new THREE.Vector3(); // Average of face points
      const R = new THREE.Vector3(); // Average of edge midpoints
      const n = mesh.facesOnFace(faces).length; // Number of adjacent faces

      for (let face of mesh.facesOnFace(faces)) {
        F.add(facePoints[oldFaces.indexOf(face)]);
      }
      F.divideScalar(n);

      const adjacentVertices = mesh.verticesOnVertex(vertex);
      for (let adjVertex of adjacentVertices) {
        const edgeKey = vertex.id < adjVertex.id ? `${vertex.id}-${adjVertex.id}` : `${adjVertex.id}-${vertex.id}`;
        R.add(edgeMidpoints.get(edgeKey));
      }
      R.divideScalar(adjacentVertices.length);

      // Update vertex position
      vertexPoints[i].addVectors(
        vertex.position.clone().multiplyScalar(n - 3),
        F,
        R.multiplyScalar(2)
      ).divideScalar(n);
    }

    // Create new vertices
    const newVertices = [];
    for (let i = 0; i < oldVertices.length; i++) {
      newVertices.push(mesh.addVertex(vertexPoints[i]));
    }
    for (let edgePoint of edgePoints.values()) {
      newVertices.push(mesh.addVertex(edgePoint));
    }
    for (let facePoint of facePoints) {
      newVertices.push(mesh.addVertex(facePoint));
    }

    // Create new faces
    const newFaces = [];
    for (let face of oldFaces) {
      const verts = mesh.verticesOnFace(face);
      const n = verts.length;

      for (let i = 0; i < n; i++) {
        const v1 = verts[i];
        const v2 = verts[(i + 1) % n];
        const edgeKey = v1.id < v2.id ? `${v1.id}-${v2.id}` : `${v2.id}-${v1.id}`;

        const newFace = [
          newVertices[oldVertices.indexOf(v1)],
          newVertices[newVertices.length - edgePoints.size + Array.from(edgePoints.keys()).indexOf(edgeKey)],
          newVertices[newVertices.length - facePoints.length + oldFaces.indexOf(face)],
          newVertices[newVertices.length - edgePoints.size + Array.from(edgePoints.keys()).indexOf(edgeKey)]
        ];
        newFaces.push(mesh.addFace(newFace));
      }
      // Set new faces to mesh
      mesh.setFaces(newFaces);
    }
  
    // ----------- STUDENT CODE END ------------
    //Gui.alertOnce("Catmull-Clark subdivide is not implemented yet");
  }

  mesh.calculateFacesArea();
  mesh.updateNormals();
};

// ================= internal functions =======================

// internal function for selecting faces in the form of a loop
Filters.procFace = function(mesh, f) {
  const faceFlags = new Array(mesh.faces.length);
  for (let i = 0; i < mesh.faces.length; i++) {
    faceFlags[i] = 0;
  }
  let sum = f.area;
  const start_he = f.halfedge.opposite.next;
  let curr_he = start_he;
  do {
    if (faceFlags[curr_he.face.id] > 0) {
      break;
    }
    sum += curr_he.face.area;
    curr_he.face.selected = true;
    faceFlags[curr_he.face.id]++;
    const last_he = curr_he;
    curr_he = curr_he.opposite.next;
    if (curr_he.face == f) {
      curr_he = last_he.next.opposite.next;
    }
  } while (true);
};

Filters.parseSelected = function(sel) {
  if (sel === undefined || sel.replace === undefined) {
    return [];
  }
  if (typeof sel === "number") {
    return [sel];
  }
  // sel = sel.replace(/[\(\)]/g,'');
  sel = sel.split(",");
  const parsedSel = [];
  for (let i = 0; i < sel.length; i++) {
    const idx = parseInt(sel[i]);
    if (!isNaN(idx)) {
      parsedSel.push(idx);
    }
  }
  return parsedSel;
};

// internal filter for updating selection
Filters.selection = function(mesh, vertIdxs, faceIdxs) {
  mesh.setSelectedVertices(Filters.parseSelected(vertIdxs));
  mesh.setSelectedFaces(Filters.parseSelected(faceIdxs));
};

// internal filter for setting display settings
Filters.displaySettings = function(
  mesh,
  showLabels,
  showHalfedge,
  shading,
  showVN,
  showFN,
  showGrid,
  showVertDots,
  showAxes,
  showVC,
  meshColor
) {
  Main.displaySettings.showIdLabels = showLabels;
  Main.displaySettings.wireframe = showHalfedge;
  Main.displaySettings.shading = shading;
  Main.displaySettings.showVN = showVN;
  Main.displaySettings.showFN = showFN;
  Main.displaySettings.showGrid = showGrid;
  Main.displaySettings.showVertDots = showVertDots;

  Main.displaySettings.showAxes = showAxes;
  Main.displaySettings.showVC = showVC;
  // Main.displaySettings.meshColor = meshColor;

  // Main.refreshDisplaySettings();
};
