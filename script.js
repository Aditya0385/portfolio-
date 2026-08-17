// Aditya Chaturvedi's 3D Portfolio Interactions - Airplane Cabin Theme

// Preload the 60 frame images for the animated airplane window view
const totalFrames = 60;
const preloadedImages = [];

function preloadFrames() {
    for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        const frameNum = String(i).padStart(3, '0');
        img.src = `ezgif-frame-${frameNum}.jpg`;
        preloadedImages.push(img);
    }
}
preloadFrames();

let currentFrameIndex = 0;

function updateFrameOnScroll() {
    const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
    let scrollProgress = 0;
    if (scrollableDistance > 0) {
        scrollProgress = Math.max(0, Math.min(1, window.scrollY / scrollableDistance));
    }
    
    // Multiply by totalFrames so we go from 0 to 59
    currentFrameIndex = Math.min(totalFrames - 1, Math.floor(scrollProgress * totalFrames));
}

window.addEventListener('scroll', () => {
    requestAnimationFrame(updateFrameOnScroll);
});

// Initialize first frame
updateFrameOnScroll();

document.addEventListener('DOMContentLoaded', () => {
    // initBackgroundParticles(); // Disabled to allow fullscreen animated flight portal background
    initHeroWindowPortal();
    initTypingEffect();
    initScrollSpy();
    initContactForm();
    init3DWindowTilt();
    initScrollZoomAnimation();
    initTimelineScrollAnimation();
});

/* ========================================================================= */
/* 1. THREE.JS 3D PARTICLE SYSTEM & WINDOW PORTAL                           */
/* ========================================================================= */

// A. Global Faint Particle Background (Starfield simulation)
function initBackgroundParticles() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const particlesCount = 700;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    const colorSky = new THREE.Color('#40a9ff');
    const colorSunset = new THREE.Color('#f4a261');

    for (let i = 0; i < particlesCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 140;
        positions[i + 1] = (Math.random() - 0.5) * 140;
        positions[i + 2] = (Math.random() - 0.5) * 140;

        const mixedColor = new THREE.Color();
        mixedColor.copy(colorSky).lerp(colorSunset, Math.random());

        colors[i] = mixedColor.r;
        colors[i + 1] = mixedColor.g;
        colors[i + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pTexture = createCircleTexture();
    const material = new THREE.PointsMaterial({
        size: 0.3,
        map: pTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.01;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.01;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        particleSystem.rotation.y += 0.0006;
        particleSystem.rotation.x += 0.0002;

        particleSystem.rotation.y += mouseX * 0.0005;
        particleSystem.rotation.x += mouseY * 0.0005;

        renderer.render(scene, camera);
    }
    animate();
}

// B. Interactive Airplane Window 3D Portal (Hero Section)
function initHeroWindowPortal() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Background airplane view animated canvas texture
    const animCanvas = document.createElement('canvas');
    animCanvas.width = 1920;
    animCanvas.height = 1080;
    const animCtx = animCanvas.getContext('2d');
    const bgTexture = new THREE.CanvasTexture(animCanvas);
    bgTexture.generateMipmaps = false;
    bgTexture.minFilter = THREE.LinearFilter;
    bgTexture.magFilter = THREE.LinearFilter;
    bgTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const bgGeometry = new THREE.PlaneGeometry(1, 1);
    const bgMaterial = new THREE.MeshBasicMaterial({
        map: bgTexture,
        depthWrite: false
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = -6;
    scene.add(bgMesh);

    // Cover calculation logic to keep the 16:9 plane covering the viewport
    function resizeBackgroundPlane() {
        const aspect = container.clientWidth / container.clientHeight;
        const dist = camera.position.z - bgMesh.position.z; // 10 - (-6) = 16
        const fovRad = (camera.fov * Math.PI) / 180;
        const vHeight = 2 * dist * Math.tan(fovRad / 2);
        const vWidth = vHeight * aspect;

        const imageAspect = 16 / 9;
        let planeWidth, planeHeight;

        if (aspect > imageAspect) {
            planeWidth = vWidth;
            planeHeight = vWidth / imageAspect;
        } else {
            planeHeight = vHeight;
            planeWidth = vHeight * imageAspect;
        }

        bgMesh.scale.set(planeWidth, planeHeight, 1);
    }

    // Initial call
    resizeBackgroundPlane();

    // Drifting 3D clouds
    const cloudsGroup = new THREE.Group();
    scene.add(cloudsGroup);

    const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
        map: createCircleTexture()
    });

    const clouds = [];
    const numClouds = 5;
    for (let i = 0; i < numClouds; i++) {
        const size = Math.random() * 5 + 4;
        const cloudGeom = new THREE.PlaneGeometry(size, size * 0.6);
        const cloud = new THREE.Mesh(cloudGeom, cloudMaterial);

        cloud.position.set(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 6 - 0.8,
            -2 + Math.random() * 2
        );

        cloud.userData = {
            speed: 0.001 + Math.random() * 0.002
        };

        cloudsGroup.add(cloud);
        clouds.push(cloud);
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const portalFrame = document.querySelector('.giant-window-portal');
    if (portalFrame) {
        portalFrame.addEventListener('mousemove', (e) => {
            const rect = portalFrame.getBoundingClientRect();
            mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2.2;
            mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2.2;
        });

        portalFrame.addEventListener('mouseleave', () => {
            mouseX = 0;
            mouseY = 0;
        });
    }

    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        resizeBackgroundPlane();
    });

    let lastFrameIndex = -1;

    function animate() {
        requestAnimationFrame(animate);

        // Update animated texture from preloaded frames only when it actually changes
        if (currentFrameIndex !== lastFrameIndex) {
            if (preloadedImages[currentFrameIndex] && preloadedImages[currentFrameIndex].complete) {
                animCtx.drawImage(preloadedImages[currentFrameIndex], 0, 0, animCanvas.width, animCanvas.height);
                bgTexture.needsUpdate = true;
                lastFrameIndex = currentFrameIndex;
            }
        }

        // Drift clouds
        clouds.forEach(cloud => {
            cloud.position.x += cloud.userData.speed;
            if (cloud.position.x > 10) {
                cloud.position.x = -10;
                cloud.position.y = (Math.random() - 0.5) * 6 - 0.8;
            }
        });

        // Smooth camera drift target (slower transition for premium cinematic feel)
        targetX += (mouseX - targetX) * 0.025;
        targetY += (mouseY - targetY) * 0.025;

        camera.position.x = targetX * 0.6;
        camera.position.y = -targetY * 0.6;
        camera.lookAt(0, 0, -6);

        // Rotate plane slightly for enhanced depth parallax
        bgMesh.rotation.y = targetX * 0.04;
        bgMesh.rotation.x = targetY * 0.04;

        renderer.render(scene, camera);
    }
    animate();
}

function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/* ========================================================================= */
/* 2. CUSTOM TYPING EFFECT                                                   */
/* ========================================================================= */
function initTypingEffect() {
    const textElement = document.getElementById('typed-text');
    if (!textElement) return;

    const words = [
        "Full-Stack Web Developer",
        "AI & Machine Learning Engineer",
        "Cloud & DevOps Architect",
        "Freelance Software Engineer"
    ];

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const delayBetweenWords = 1500;

    function type() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
            textElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            textElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let delay = isDeleting ? deletingSpeed : typingSpeed;

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            delay = delayBetweenWords;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 500;
        }

        setTimeout(type, delay);
    }

    type();
}

/* ========================================================================= */
/* 3. SCROLLSPY ACTIVE LINK LOOKUP                                           */
/* ========================================================================= */
function initScrollSpy() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar-custom .nav-link');
    const navbar = document.querySelector('.navbar-custom');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });

        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}

/* ========================================================================= */
/* 4. CONTACT FORM HANDLER                                                   */
/* ========================================================================= */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin ms-2"></i>';
        submitBtn.style.boxShadow = '0 0 20px rgba(79, 70, 229, 0.4)';
        submitBtn.style.background = '#4f46e5';

        setTimeout(() => {
            submitBtn.innerHTML = 'Sent Successfully! <i class="fa-solid fa-check ms-2"></i>';
            submitBtn.style.boxShadow = '0 0 25px rgba(13, 148, 136, 0.5)';
            submitBtn.style.background = '#0d9488';
            submitBtn.style.color = '#ffffff';

            form.reset();

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.style.boxShadow = '';
                submitBtn.style.background = '';
                submitBtn.style.color = '';
            }, 3000);

        }, 1500);
    });
}

/* ========================================================================= */
/* 5. INTERACTIVE 3D AIRPLANE WINDOW TILT                                    */
/* ========================================================================= */
function init3DWindowTilt() {
    const container = document.querySelector('.window-container');
    const windowEl = document.querySelector('.airplane-window');
    const reflection = document.querySelector('.window-reflection');
    if (!container || !windowEl) return;

    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();

        // Calculate normalized mouse positions (-0.5 to 0.5) inside the container
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        // Apply a gentle rotation (max 22 degrees)
        const tiltX = -y * 22;
        const tiltY = x * 22;

        windowEl.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.03)`;

        // Tilt/move the reflection layer slightly in the opposite direction
        if (reflection) {
            reflection.style.transform = `rotate(-30deg) translate(${-30 - x * 40}%, ${-30 - y * 40}%)`;
        }
    });

    container.addEventListener('mouseleave', () => {
        // Reset smoothly when cursor leaves card area
        windowEl.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        if (reflection) {
            reflection.style.transform = 'rotate(-30deg) translate(-30%, -30%)';
        }
    });
}

/* ========================================================================= */
/* 6. SCROLL-DRIVEN WINDOW ZOOM ANIMATION                                    */
/* ========================================================================= */
function initScrollZoomAnimation() {
    const windowFrame = document.getElementById('cabin-window-frame');
    if (!windowFrame) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const maxScroll = window.innerHeight; // scale animation transitions over the height of the first viewport
        const scaleVal = 1 + (scrollY / maxScroll) * 3.0; // scale up to 4.0

        // Smoothly scale up the window frame cutout on scroll
        windowFrame.style.transform = `translate(-50%, -50%) scale(${Math.min(scaleVal, 4.0)})`;
    });
}

/* ========================================================================= */
/* 7. SCROLL-DRIVEN EXPERIENCE TIMELINE ANIMATION                            */
/* ========================================================================= */
function initTimelineScrollAnimation() {
    const timeline = document.querySelector('.timeline');
    const progressLine = document.querySelector('.timeline-progress-line');
    const items = document.querySelectorAll('.timeline-item');
    if (!timeline || !progressLine) return;

    window.addEventListener('scroll', () => {
        const rect = timeline.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate scroll progress through the timeline container
        const startOffset = viewportHeight / 1.5;
        const totalHeight = rect.height;
        const currentProgress = startOffset - rect.top;

        let progressPercent = (currentProgress / totalHeight) * 100;
        progressPercent = Math.max(0, Math.min(progressPercent, 100));

        // Update height of the blue progress line
        progressLine.style.height = `${progressPercent}%`;

        // Activate dots when progress passes their offsets
        items.forEach(item => {
            const itemOffsetTop = item.offsetTop;
            if (currentProgress >= itemOffsetTop - 20) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    });
}

