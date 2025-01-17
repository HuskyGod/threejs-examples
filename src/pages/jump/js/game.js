export default class Game {
    constructor () {
        this.config = {
            isMobile: false,
            background: 0x282828,
            ground: -1,
            fallingSpeed: 0.2,
            cubeColor: 0xbebebe,
            cubeWidth: 4,
            cubeHeight: 2,
            cubeDeep: 4,
            jumperColor: 0x232323,
            jumperWidth: 1,
            jumperHeight: 2,
            jumperDeep: 1
        }

        this.score = 0
        this.size = {
            width: window.innerWidth,
            height: window.innerHeight
        }
        this.scene = new THREE.Scene()
        this.cameraPos = {
            current: new THREE.Vector3(0, 0, 0),
            next: new THREE.Vector3()
        }
        this.camera = new THREE.OrthographicCamera(this.size.width / -80, this.size.width / 80, this.size.width / 80, this.size.width / -80, 0, 5000)
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.querySelector('canvas')
        })

        this.cubes = []
        this.cubeStat = {
            nextDir: ''
        }
        this.jumperStat = {
            ready: false,
            xSpeed: 0,
            ySpeed: 0
        }
        this.falledStat = {
            location: -1,
            distance: 0
        }
        this.fallingStat = {
            speed: 0.2,
            end: false
        }
    }
    init () {
        this._checkUserAgent() // 检查是否是移动端
        this._setCamera() // 设置摄像机位置
        this._setRenderer() // 设置渲染器参数
        this._setLight() // 设置光照
        this._createCube() // 加个放块
        this._createCube() // 再加方块
        this._createJumper() // 加入游戏者jumper
        this._updateCamera() // 更新照相机

        // 判断触发的事件
        const mouseEvents = (this.config.isMobile) ? {
            down: 'touchstart',
            up: 'touchend'
        } : {
            down: 'mousedown',
            up: 'mouseup'
        }

        const canvas = document.querySelector('canvas')
        canvas.addEventListener(mouseEvents.down, () => {
            this._handleMousedown()
        })
        canvas.addEventListener(mouseEvents.up, () => {
            this._handleMouseup()
        })
        window.addEventListener('reset', () => {
            this._handleWindowResize()
        })
    }
    // 游戏失败重新开始的初始化配置
    restart () {
        this.score = 0
        this.cameraPos = {
            current: new THREE.Vector3(0, 0, 0),
            next: new THREE.Vector3()
        }
        this.falledStat = {
            speed: 0.2,
            end: false
        }
        const length = this.cubes.length
        for (let i = 0; i < length; i++) {
            this.scene.remove(this.cubes.pop())
        }
        this.scene.remove(this.jumper)
        this.successCallback(this.score)
        this._createCube()
        this._createCube()
        this._createJumper()
        this._updateCamera()
    }
    addSuccessFn (fn) {
        this.successCallback = fn
    }
    addFailedFn (fn) {
        this.failedCallback = fn
    }
    // 检测是否手机端
    _checkUserAgent () {
        const n = navigator.userAgent;
        if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i)) {
            this.config.isMobile = true
        }
    }
    _createHelpers () {}
    _handleWindowResize () {
        this._setSize()
        this.camera.left = this.size.width / -80
        this.camera.lerightft = this.size.width / -80
        this.camera.top = this.size.height / -80
        this.camera.bottom = this.size.height / -80
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.size.width, this.size.height)
        this._render()
    }
    // 鼠标按下或触摸开始绑定的函数
    /*根据鼠标按下的时间来给 xSpeed 和 ySpeed 赋值
     *@return {Number} this.jumperStat.xSpeed 水平方向上的速度
     *@return {Number} this.jumperStat.ySpeed 垂直方向上的速度
    **/
    _handleMousedown () {
        if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
            this.jumper.scale.y -= 0.01
            this.jumperStat.xSpeed += 0.004
            this.jumperStat.ySpeed += 0.008
            this._render(this.scene, this.camera)
            requestAnimationFrame(() => {
                this._handleMousedown()
            })
        }
    }
    _handleMouseup () {
        // 标记鼠标松开了
        this.jumperStat.ready = true
        // 判断jumper是在方块水平面之上，是的话说明需要继续运动
        if (this.jumper.position.y >= 1) {
            if (this.cubeStat.nextDir === 'left') {
                this.jumper.position.x -= this.jumperStat.xSpeed
            } else {
                this.jumper.position.z -= this.jumperStat.xSpeed
            }
            this.jumper.position.y += this.jumperStat.ySpeed
            console.log(this.jumper.position.y, this.jumperStat.ySpeed)
            // 随着跳起来自己也变回来
            if (this.jumper.scale.y < 1) {
                this.jumper.scale.y += 0.02
            }
            // jumper在垂直方向上先上升后下降
            this.jumperStat.ySpeed -= 0.01
            this._render(this.scene, this.camera)
            requestAnimationFrame(() => {
                this._handleMouseup()
            })
        } else {
            // jumper掉落到方块水平位置，开始充值状态，并开始判断掉落是否成功
            this.jumperStat.ready = false
            this.jumperStat.xSpeed = 0
            this.jumperStat.ySpeed = 0
            this.jumper.position.y = 1
            this._checkInCube()
            if (this.falledStat.location === 1) {
                this.score++
                this._createCube()
                this._updateCamera()
                if (this.successCallback) {
                    this.successCallback(this.score)
                }
            } else {
                this._falling()
            }
        }
    }
    _fallingRotate (dir) {
        const offset = this.falledStat.distance - this.config.cubeWidth / 2
        let rotateAxis = 'z'
        let rotateAdd = this.jumper.rotation[rotateAxis] + 0.1
        let rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2
        let fallingTo = this.config.ground + this.config.jumperWidth / 2 + offset
        if (dir === 'rightTop') {
            rotateAxis = 'x'
            rotateAdd = this.jumper.rotation[rotateAxis] - 0.1
            rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2
            this.jumper.geometry.translate.z = offset
        } else if (dir === 'rightBottom') {
            rotateAxis = 'x'
            rotateAdd = this.jumper.rotation[rotateAxis] + 0.1
            rotateTo = this.jumper.rotation[rotateAxis] > Math.PI / 2
            this.jumper.geometry.translate.z = -offset
        } else if (dir === 'leftBottom') {
            rotateAxis = 'z'
            rotateAdd = this.jumper.rotation[rotateAxis] - 0.1
            rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2
            this.jumper.geometry.translate.x = -offset
        } else if (dir === 'leftTop') {
            rotateAxis = 'z'
            rotateAdd = this.jumper.rotation[rotateAxis] + 0.1
            rotateTo = this.jumper.rotation[rotateAxis] > Math.PI / 2
            this.jumper.geometry.translate.x = offset
        } else if (dir === 'none') {
            rotateTo = false
            fallingTo = this.config.ground
        } else {
            throw Error('Arguments Error')
        }
        if (!this.falledStat.end) {
            if (rotateTo) {
                this.jumper.rotation[rotateAxis] = rotateAdd
            } else if (this.jumper.position.y > fallingTo) {
                this.jumper.position.y -= this.config.fallingSpeed
            } else {
                this.falledStat.end = true
            }
            this._render()
            requestAnimationFrame(() => {
                this._falling()
            })
        } else {
            if (this.failedCallback) {
                this.failedCallback()
            }
        }
    }
    _falling () {
        if (this.falledStat.location === 0) {
            this._fallingRotate('none')
        } else if (this.falledStat.location === -10) {
            if (this.cubeStat.nextDir === 'left') {
                this._fallingRotate('leftTop')
            } else {
                this._fallingRotate('rightTop')
            }
        } else if (this.falledStat.location === 10) {
            if (this.cubeStat.nextDir === 'left') {
                if (this.jumper.position.x < this.cubes[this.cubes.length - 1].position.x) {
                    this._fallingRotate('leftTop')
                } else {
                    this._fallingRotate('leftBottom')
                }
            } else {
                if (this.jumper.position.z < this.cubes[this.cubes.length - 1].position.z) {
                    this._fallingRotate('rightTop')
                } else {
                    this._fallingRotate('rightBottom')
                }
            }
        }
    }
    /**
     *判断jumper的掉落位置
     * @return {Number} this.falledStat.location
     * -1 : 掉落在原来的方块，游戏继续
     * -10: 掉落在原来方块的边缘，游戏失败
     *  1 : 掉落在下一个方块，游戏成功，游戏继续
     *  10: 掉落在下一个方块的边缘，游戏失败
     *  0 : 掉落在空白区域，游戏失败
    **/
    _checkInCube () {
        if (this.cubes.length > 1) {
            // jumper的位置
            const pointO = {
                x: this.jumper.position.x,
                z: this.jumper.position.z
            }
            // 当前方块的位置
            const pointA = {
                x: this.cubes[this.cubes.length - 1 -1].position.x,
                z: this.cubes[this.cubes.length - 1 -1].position.z
            }
            // 下个方块的位置
            const pointB = {
                x: this.cubes[this.cubes.length -1].position.x,
                z: this.cubes[this.cubes.length -1].position.z
            }
            let distanceS, // jumper和当前方块的坐标轴距离
                distanceL // jumper和下一个方块的坐标轴距离
            if (this.cubeStat.nextDir === 'left') {
                distanceS = Math.abs(pointO.x - pointA.x)
                distanceL = Math.abs(pointO.x - pointB.x)
            } else {
                distanceS = Math.abs(pointO.z - pointA.z)
                distanceL = Math.abs(pointO.z - pointB.z)
            }
            let should = this.config.cubeWidth / 2 + this.config.jumperHeight / 2
            let result = 0
            if (distanceS < should) {
                this.falledStat.distance = distanceL
                result = distanceS < this.config.cubeWidth / 2 ? -1 : -10
            } else if (distanceL < should) {
                this.falledStat.distance = distanceS
                result = distanceL < this.config.cubeWidth / 2 ? 1 : 10
            } else {
                result = 0
            }
            this.falledStat.location = result
        }
    }
    // 每成功一步, 重新计算摄像机的位置，保证游戏始终在画布中间进行
    _updateCameraPos () {
        const lastIndex = this.cubes.length - 1
        const pointA = {
            x: this.cubes[lastIndex].position.x,
            z: this.cubes[lastIndex].position.z
        }
        const pointB = {
            x: this.cubes[lastIndex - 1].position.x,
            z: this.cubes[lastIndex - 1].position.z
        }
        const pointR = new THREE.Vector3()
        pointR.x = (pointA.x + pointB.x) / 2
        pointR.y = 0
        pointR.z = (pointA.z + pointB.z) / 2
        this.cameraPos.next = pointR
    }
    // 基于更新后的摄像机位置，重新设置摄像机坐标
    _updateCamera () {
        const c = {
            x: this.cameraPos.current.x,
            y: this.cameraPos.current.y,
            z: this.cameraPos.current.z
        }
        const n = {
            x: this.cameraPos.next.x,
            y: this.cameraPos.next.y,
            z: this.cameraPos.next.z
        }
        if (c.x > n.x || c.z > n.z) {
            this.cameraPos.current.x -= 0.1
            this.cameraPos.current.z -= 0.1
            if (this.cameraPos.current.x - this.cameraPos.next.x < 0.05) {
                this.cameraPos.current.x = this.cameraPos.next.x
            }
            if (this.cameraPos.current.z - this.cameraPos.next.z < 0.05) {
                this.cameraPos.current.z = this.cameraPos.next.z
            }
            this.camera.lookAt(new THREE.Vector3(c.x, 0, c.z))
            this._render()
            requestAnimationFrame(() => {
                this._updateCamera()
            })
        }
    }
    // 加入游戏者jumper
    _createJumper () {
        const material = new THREE.MeshLambertMaterial({color: this.config.jumperColor})
        const geometry = new THREE.CubeGeometry(this.config.jumperWidth, this.config.jumperHeight, this.config.jumperDeep)
        geometry.translate(0, 1, 0)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = 1
        this.jumper = mesh
        this.scene.add(this.jumper)
    }
    // 新增一个方块, 新的方块有2个随机方向
    _createCube () {
        const material = new THREE.MeshLambertMaterial({color: this.config.cubeColor})
        const geometry = new THREE.CubeGeometry(this.config.cubeWidth, this.config.cubeHeight, this.config.cubeDeep)
        const mesh = new THREE.Mesh(geometry, material)
        if (this.cubes.length) {
            const random = Math.random()
            this.cubeStat.nextDir = random > 0.5 ? 'left' : 'right'
            mesh.position.x = this.cubes[this.cubes.length - 1].position.x
            mesh.position.y = this.cubes[this.cubes.length - 1].position.y
            mesh.position.z = this.cubes[this.cubes.length - 1].position.z
            if (this.cubeStat.nextDir === 'left') {
                mesh.position.x = this.cubes[this.cubes.length - 1].position.x - 4 * Math.random() - 6
            } else {
                mesh.position.z = this.cubes[this.cubes.length - 1].position.z - 4 * Math.random() - 6
            }
        }
        this.cubes.push(mesh)
        if (this.cubes.length > 6) {
            this.scene.remove(this.cubes.shift())
        }
        this.scene.add(mesh)
        // 每新增一个方块，重新计算摄像机坐标
        if (this.cubes.length > 1) {
            this._updateCameraPos()
        }
    }
    // 渲染
    _render () {
        this.renderer.render(this.scene, this.camera)
    }
    // 设置光照
    _setLight () {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1)
        directionalLight.position.set(3, 10, 5)
        this.scene.add(directionalLight)

        const light = new THREE.AmbientLight(0xffffff, 0.3)
        this.scene.add(light)
    }
    // 设置摄像机位置
    _setCamera () {
        this.camera.position.set(100, 100, 100)
        this.camera.lookAt(this.cameraPos.current)
    }
    // 设置渲染器参数
    _setRenderer () {
        this.renderer.setSize(this.size.width, this.size.height)
        this.renderer.setClearColor(this.config.background)
    }
    _setSize () {
        this.size.width = window.innerWidth
        this.size.height = window.innerHeight
    }
}