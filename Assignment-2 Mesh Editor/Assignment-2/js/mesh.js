// In this file you will implement traversal and analysis for your assignment.
// Make sure to familiarize yourself with the utility functions in meshUtils.js
// they might be useful for the second part of your assignment!

////////////////////////////////////////////////////////////////////////////////
// Traversal
////////////////////////////////////////////////////////////////////////////////

// Return all vertices on face f
Mesh.prototype.verticesOnFace = function(f) {
  const vertices = [];
  let he = f.halfedge;
  const first = he;
  while (true) {
    vertices.push(he.vertex);
    he = he.next;
    if (he === first) {
      break;
    }
  }
  return vertices;
};

// Return all halfedges on face f
Mesh.prototype.edgesOnFace = function(f) {
  const halfedges = [];

  // ----------- STUDENT CODE BEGIN ------------
  let startEdge = f.halfedge
  let currentEdge = startEdge
  do {
    halfedges.push(currentEdge)
    currentEdge = currentEdge.next
  } while (currentEdge !== startEdge)
  // ----------- STUDENT CODE END ------------

  return halfedges;
};

// Return all faces adjacent to input face, not
// including input face.
Mesh.prototype.facesOnFace = function(f) {
  const faces = [];

  // ----------- STUDENT CODE BEGIN ------------
  
  // ----------- STUDENT CODE END ------------

  return faces;
};

// Return one-ring neighbors of input vertex, not
// including the input vertex itself
Mesh.prototype.verticesOnVertex = function(v) {
  const vertices = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  // ----------- STUDENT CODE END ------------

  return vertices;
};

// Return all halfedges that point away from v
Mesh.prototype.edgesOnVertex = function(v) {
  const halfedges = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  // ----------- STUDENT CODE END ------------

  return halfedges;
};

// Return all faces that include v as a vertex.
Mesh.prototype.facesOnVertex = function(v) {
  const faces = [];

  // ----------- STUDENT CODE BEGIN ------------
  for (const face of this.faces) {
    let vetFace = this.verticesOnFace(face)
    if (vetFace.includes(v)) {
      faces.push(face)
    }
  }
  // ----------- STUDENT CODE END ------------

  return faces;
};

// Return the vertices that form the endpoints of a given edge
Mesh.prototype.verticesOnEdge = function(e) {
  const vertices = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 2 lines of code.
  // ----------- STUDENT CODE END ------------

  return vertices;
};

// Return the faces that include a given edge
Mesh.prototype.facesOnEdge = function(e) {
  const faces = [];
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 2 lines of code.
  // ----------- STUDENT CODE END ------------
  return faces;
};

// Return the edge pointing from v1 to v2
Mesh.prototype.edgeBetweenVertices = function(v1, v2) {
  let out_he = undefined;
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 11 lines of code.
  // ----------- STUDENT CODE END ------------
  return out_he;
};

////////////////////////////////////////////////////////////////////////////////
// Analysis
////////////////////////////////////////////////////////////////////////////////

// Return the surface area of a provided face f.
Mesh.prototype.calculateFaceArea = function(f) {
  let area = 0.0;
  // ----------- STUDENT CODE BEGIN ------------
  const v0 = f.halfedge.vertex.position;
  const v1 = f.halfedge.next.vertex.position;
  const v2 = f.halfedge.next.next.vertex.position;
  
  // Use the cross product of two edges to calculate the area
  const edge1 = new THREE.Vector3().subVectors(v1, v0);
  const edge2 = new THREE.Vector3().subVectors(v2, v0);
  const crossProduct = new THREE.Vector3().crossVectors(edge1, edge2);

  // Area of the triangle is half the magnitude of the cross product
  area = crossProduct.length() * 0.5;
  // ----------- STUDENT CODE END ------------
  f.area = area;
  return area;
};

// Update the area attributes of all faces in the mesh
Mesh.prototype.calculateFacesArea = function() {
  for (let i = 0; i < this.faces.length; ++i) {
    this.calculateFaceArea(this.faces[i]);
  }
};

// Calculate the vertex normal at a given vertex,
// using the face normals of bordering faces, weighted by face area
Mesh.prototype.calculateVertexNormal = function(v) {
  var v_normal = new THREE.Vector3(0, 0, 0);
  // ----------- STUDENT CODE BEGIN ------------
  function normalizeVector(vector) {
    var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
    if (length !== 0) {
        vector.x /= length
        vector.y /= length
        vector.z /= length
    }
    return vector
  }

  var adjacent = this.facesOnVertex(v) // Get all the faces adjacent to the vertex
  for (let face of adjacent) {
    var faceNormal = this.calculateFaceNormal(face) // calculate the normal of the given face
    var weightedNormal = faceNormal.multiplyScalar(face.area)
    v_normal.add(weightedNormal)
  }
  normalizeVector(v_normal)
  // ----------- STUDENT CODE END ------------
  v.normal = v_normal;
  return v_normal;
};

// update the vertex normals of every vertex in the mesh
Mesh.prototype.updateVertexNormals = function() {
  for (let i = 0; i < this.vertices.length; ++i) {
    this.calculateVertexNormal(this.vertices[i]);
  }
};

// compute the average length of edges touching v
Mesh.prototype.averageEdgeLength = function(v) {
  let avg = 0.0;

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 9 lines of code.
  // ----------- STUDENT CODE END ------------

  return avg;
};

////////////////////////////////////////////////////////////////////////////////
// Topology
////////////////////////////////////////////////////////////////////////////////

// Given a face in the shape of an arbitrary polygon,
// split that face so it consists only of several triangular faces. 
Mesh.prototype.triangulateFace = function(f) {
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 8 lines of code.
  // ----------- STUDENT CODE END ------------
};
