// 音乐播放器应用主文件

// 全局变量
let audioPlayer = new Audio();
let currentTrack = 0;
let playlist = [];
let isPlaying = false;

// DOM元素
const playButton = document.getElementById('play');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const scanButton = document.getElementById('scan-button');
const volumeSlider = document.getElementById('volume');
const progressBar = document.getElementById('progress');
const progressContainer = document.querySelector('.progress-bar');
const currentTimeElement = document.getElementById('current-time');
const durationElement = document.getElementById('duration');
const playlistElement = document.getElementById('playlist');
const titleElement = document.getElementById('title');
const artistElement = document.getElementById('artist');
const coverElement = document.getElementById('cover');

// 初始化函数
function init() {
    // 设置事件监听器
    playButton.addEventListener('click', togglePlay);
    prevButton.addEventListener('click', playPrevious);
    nextButton.addEventListener('click', playNext);
    scanButton.addEventListener('click', scanLocalMusic);
    volumeSlider.addEventListener('input', updateVolume);
    
    // 为移动设备添加触摸事件
    if ('ontouchstart' in window) {
        progressContainer.addEventListener('touchstart', handleProgressTouch);
        progressContainer.addEventListener('touchmove', handleProgressTouch);
    } else {
        progressContainer.addEventListener('click', setProgress);
    }
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    
    // 添加屏幕方向变化监听
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 设置初始音量
    audioPlayer.volume = volumeSlider.value;
    
    // 加载本地存储中的播放列表（如果有）
    loadPlaylistFromStorage();
}

// 加载本地存储中的播放列表
function loadPlaylistFromStorage() {
    const savedPlaylist = localStorage.getItem('musicPlaylist');
    if (savedPlaylist) {
        playlist = JSON.parse(savedPlaylist);
        renderPlaylist();
    }
}

// 保存播放列表到本地存储
function savePlaylistToStorage() {
    localStorage.setItem('musicPlaylist', JSON.stringify(playlist));
}

// 扫描本地音乐
function scanLocalMusic() {
    // 创建一个文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'audio/*';
    
    // 监听文件选择事件
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        
        // 清空当前播放列表
        playlist = [];
        
        // 处理选择的音乐文件
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // 只处理音频文件
            if (file.type.startsWith('audio/')) {
                // 从文件名中提取标题和艺术家信息
                const fileName = file.name.replace(/\.[^/.]+$/, ""); // 移除扩展名
                let title = fileName;
                let artist = "未知艺术家";
                
                // 尝试从文件名中分离艺术家和标题（假设格式为"艺术家 - 标题"）
                if (fileName.includes(' - ')) {
                    const parts = fileName.split(' - ');
                    artist = parts[0].trim();
                    title = parts[1].trim();
                }
                
                // 创建音乐对象并添加到播放列表
                const track = {
                    title: title,
                    artist: artist,
                    file: file,
                    url: URL.createObjectURL(file)
                };
                
                playlist.push(track);
            }
        }
        
        // 保存播放列表到本地存储
        savePlaylistToStorage();
        
        // 渲染播放列表
        renderPlaylist();
        
        // 如果有音乐，加载第一首
        if (playlist.length > 0) {
            currentTrack = 0;
            loadTrack(currentTrack);
        }
    });
    
    // 触发文件选择对话框
    fileInput.click();
}

// 渲染播放列表
function renderPlaylist() {
    // 清空当前播放列表
    playlistElement.innerHTML = '';
    
    // 添加每首歌曲到播放列表
    playlist.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        if (index === currentTrack) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <div class="playlist-item-info">
                <div class="playlist-item-title">${track.title}</div>
                <div class="playlist-item-artist">${track.artist}</div>
            </div>
        `;
        
        // 添加点击事件
        li.addEventListener('click', () => {
            currentTrack = index;
            loadTrack(currentTrack);
            playTrack();
        });
        
        playlistElement.appendChild(li);
    });
}

// 加载音轨
function loadTrack(index) {
    if (playlist.length === 0 || index < 0 || index >= playlist.length) return;
    
    // 停止当前播放
    audioPlayer.pause();
    
    // 加载新音轨
    const track = playlist[index];
    audioPlayer.src = track.url;
    audioPlayer.load();
    
    // 更新界面
    titleElement.textContent = track.title;
    artistElement.textContent = track.artist;
    
    // 更新封面图（这里使用默认封面，实际应用中可以从音乐文件中提取封面）
    coverElement.src = 'img/default-cover.jpg';
    
    // 更新播放列表中的活动项
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 播放音轨
function playTrack() {
    audioPlayer.play();
    isPlaying = true;
    updatePlayButton();
}

// 暂停音轨
function pauseTrack() {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayButton();
}

// 切换播放/暂停
function togglePlay() {
    if (playlist.length === 0) {
        // 如果播放列表为空，提示用户扫描音乐
        alert('请先扫描本地音乐');
        return;
    }
    
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

// 播放上一首
function playPrevious() {
    if (playlist.length === 0) return;
    
    currentTrack--;
    if (currentTrack < 0) {
        currentTrack = playlist.length - 1;
    }
    
    loadTrack(currentTrack);
    playTrack();
}

// 播放下一首
function playNext() {
    if (playlist.length === 0) return;
    
    currentTrack++;
    if (currentTrack >= playlist.length) {
        currentTrack = 0;
    }
    
    loadTrack(currentTrack);
    playTrack();
}

// 更新播放按钮状态
function updatePlayButton() {
    if (isPlaying) {
        playButton.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        playButton.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// 更新音量
function updateVolume() {
    audioPlayer.volume = volumeSlider.value;
    
    // 更新音量图标
    const volumeIcon = document.querySelector('.volume-container i');
    if (audioPlayer.volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (audioPlayer.volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

// 更新进度条
function updateProgress() {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 1;
    const progressPercent = (currentTime / duration) * 100;
    
    // 更新进度条宽度
    progressBar.style.width = `${progressPercent}%`;
    
    // 更新当前时间显示
    currentTimeElement.textContent = formatTime(currentTime);
}

// 设置进度
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    
    audioPlayer.currentTime = (clickX / width) * duration;
}

// 处理触摸进度条
function handleProgressTouch(e) {
    e.preventDefault();
    const width = progressContainer.clientWidth;
    const touch = e.touches[0];
    const rect = progressContainer.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    const duration = audioPlayer.duration;
    
    // 确保触摸点在进度条范围内
    if (relativeX >= 0 && relativeX <= width) {
        audioPlayer.currentTime = (relativeX / width) * duration;
    }
}

// 处理屏幕方向变化
function handleOrientationChange() {
    // 在屏幕方向变化时调整UI
    setTimeout(() => {
        // 给浏览器一些时间来完成旋转
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }, 100);
}

// 更新总时长显示
function updateDuration() {
    durationElement.textContent = formatTime(audioPlayer.duration);
}

// 格式化时间（秒 -> mm:ss）
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// 页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', init);

// 注册Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker 注册成功:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker 注册失败:', error);
            });
    });
}