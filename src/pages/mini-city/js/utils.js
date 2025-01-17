export default {
    makeShape () {
        let shape
        if (window.THREE && arguments.length) {
            let arr = arguments[0]
            shape = new THREE.Shape()
            shape.moveTo(arr[0][0], arr[0][1])
            for (let index = 1; index < arr.length; index++) {
                shape.lineTo(arr[index][0], arr[index][1])
            }
            if (arguments.length > 1) {
                for (let index = 1; index < arguments.length; index++) {
                    let pathCoords = arguments[index]
                    let path = new THREE.Path()
                    path.moveTo(pathCoords[0][0], pathCoords[0][1])
                    for (let index = 1; index < pathCoords.length; index++) {
                        path.lineTo(pathCoords[index][0], pathCoords[index][1])
                    }
                    shape.holes.push(path)
                }
            }
            return shape
        } else {
            console.error('Something wrong!')
        }
    },
    makeExtrudeGeometry (shape, amount) {
        let extrudeSetting = {
            steps: 1,
            amount,
            bevelEnabled: false
        }
        let geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSetting)
        geometry.rotateX(-0.5 * Math.PI)
        return geometry
    },
    makeShapeGeometry () {
    },
    makeMesh (type, geometry, color) {
        let material
        let mesh
        if (type === 'lambert') {
            material = new THREE.MeshLambertMaterial({color})
        } else if (type === 'phong') {
            material = new THREE.MeshPhongMaterial({color})
        } else {
            console.error('没有类型')
        }

        mesh = new THREE.Mesh(geometry, material)

        mesh.castShadow = true
        mesh.receiveShadow = true

        return mesh
    }
}