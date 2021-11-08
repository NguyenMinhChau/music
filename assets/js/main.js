const $$ = document.querySelectorAll.bind(document);
const $ = document.querySelector.bind(document);
const getAPI = 'https://mp3.zing.vn/xhr/chart-realtime?songId=0&videoId=0&albumId=0&chart=song&time=-1';
const MUSIC_YOURSELF = 'MUSIC_YOURSELF';

const controllPlayingTitle = $('.content-controll .controll-playing-title');
const controllThumbail = $('.content-controll .controll-thumbail');
const controllThumbnailContent = $('.content-controll .controll-thumbnail-content');

const controllsRedo = $('.controlls .controlls-redo');
const controllsPrev = $('.controlls .controlls-prev');
const controllsPlayPause = $('.controlls .controlls-play-pause');
const controllsPlay = $('.controlls .controlls-play');
const controllsPause = $('.controlls .controlls-pause');
const controllsNext = $('.controlls .controlls-next');
const controllsRandom = $('.controlls .controlls-random');

const controllRange = $('#controll-range');
const audio = $('#audio')
const currentTime = $('#current-time');
const durationTime = $('#duration-time');

const contentListMusic = $('.content-list-music');

const app = {
    currenIndex: 0,
    isPlayPause: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(MUSIC_YOURSELF)) || {},
    //thiết lập cho Repeat và Random nên phải dùng đến key
    setConfig: function (key, value) {
        this.config[key] = value;
        localStorage.setItem(MUSIC_YOURSELF, JSON.stringify(this.config));
    },
    getMusic(callback) {
        fetch(getAPI)
            .then(res => res.json())
            .then(callback);
    },
    renderMusic(data) {
        var musics = data.data.song;
        var htmls = musics.map((music,index) => {
            return `
            <div class="content-list-item" data-index="${index}">
                <div class="item-image" style="background-image: url(${music.thumbnail});"></div>
                <div class="content-list-author">
                    <h4 class="song-name">${music.name}</h4>
                    <p class="author-name">${music.performer}</p>
                </div>
                <div class="content-list-more">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>`
        })
        $('.content-list-music').innerHTML = htmls.join('');
    },
    handleEvent(){
        //Xử lý cd thumbnail
        const _this = this;
        var thumbnailWidth = controllThumbnailContent.offsetWidth;
        document.onscroll = function () {
            var scrollTop = document.documentElement.scrollTop || window.scrollY;
            var newThumbWidth = thumbnailWidth - scrollTop;
            controllThumbnailContent.style.width = newThumbWidth > 0 ? newThumbWidth + 'px' : 0;
            controllThumbnailContent.style.opacity = newThumbWidth / thumbnailWidth;
        }
        //Xử lý quay thumbnail
        const animateCD = controllThumbail.animate([
            { transform: 'rotate(360deg)'}
        ],{
            duration: 8000,
            iterations: Infinity
        })
        animateCD.pause();
        //Xử lý play pause
        controllsPlayPause.onclick = function () {
            _this.isPlayPause = !_this.isPlayPause;
            if(_this.isPlayPause){
                audio.play();
            }
            else{
                audio.pause();
            }
        }
        //Xử lý audio play
        audio.onplay = function () { 
            _this.isPlayPause = true;
            controllsPlayPause.classList.add('playing');
            animateCD.play();
            $$('.content-list-item').forEach((item,index) => {
                if(index == _this.currenIndex){
                    item.classList.add('active');
                }
                else{
                    item.classList.remove('active');
                }
            })
            _this.scrollActiveSong();
        }
        //Xử lý audio pause
        audio.onpause = function () {
            controllsPlayPause.classList.remove('playing');
            animateCD.pause();
        }
        //xử lý thanh tiến độ
        audio.ontimeupdate = function () { 
            let currentTimeMinutue = parseInt((audio.currentTime / 60));
            let currentTimeSecond = parseInt((audio.currentTime % 60));
            if(currentTimeSecond < 10){
                currentTimeSecond = "0" + currentTimeSecond;
            }
            if(currentTimeMinutue < 10){
                currentTimeMinutue = "0" + currentTimeMinutue;
            }
            currentTime.innerHTML = currentTimeMinutue + ":"
            + currentTimeSecond;

            let durationTimeMinutue = parseInt((audio.duration / 60));
            let durationTimeSecond = parseInt((audio.duration % 60));
            if(durationTimeSecond < 10){
                durationTimeSecond = "0" + durationTimeSecond;
            }
            if(durationTimeMinutue < 10){
                durationTimeMinutue = "0" + durationTimeMinutue;
            }
            if(durationTimeMinutue && durationTimeSecond){
                durationTime.innerHTML = durationTimeMinutue + ":" 
                + durationTimeSecond;
            }
            if(audio.duration){
                const progressPercent = (audio.currentTime / audio.duration) * 100;
                controllRange.value = progressPercent;
            }
        }
        // xử lý khi kéo thanh tiến độ
        controllRange.onchange = function(e){
            const seekTime = (audio.duration / 100) * e.target.value;
            audio.currentTime = seekTime;
        }
        //Xử lý nextSong
        controllsNext.onclick = function () {
            if(!_this.isRandom){
                _this.nextSong();
                audio.play();
            }else{
                _this.randomSong();
                audio.play();
            }
        }
        //Xử lý prevSong
        controllsPrev.onclick = function () {
            if(!_this.isRandom){
                _this.prevSong();
                audio.play();
            }
            else{
                _this.randomSong();
            }
        }
        //Xử lý random
        controllsRandom.onclick = function () {
            _this.isRandom = !_this.isRandom;
            _this.setConfig('isRandom', _this.isRandom);
            controllsRandom.classList.toggle('active',_this.isRandom);
        }
        //Xử lý repeat
        controllsRedo.onclick = function () {
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig('isRepeat', _this.isRepeat);
            controllsRedo.classList.toggle('active',_this.isRepeat);
        }
        //Xử lý sự kiện audio kết thúc cho Repeat: onended
        audio.onended = function () {
            if(_this.isRepeat){
                audio.play();
            }else{
                controllsNext.click();
            }
        }
        //Xử lý click vào item Song
        contentListMusic.onclick = function (e) {
            var songNode = e.target.closest('.content-list-item:not(.active)');
            var options = e.target.closest('.content-list-more');
            if(songNode && !options){
                _this.currenIndex = Number(songNode.dataset.index);
                _this.loadCurrentSong();
            }
            if(options){
                console.log('options');
            }
        }
    },
    nextSong(){
        this.currenIndex++;
        this.musics
        .then(music => {
            if(this.currenIndex > music.length - 1){
                this.currenIndex = 0;
            }
            this.loadCurrentSong();
        })
    },
    prevSong(){
        this.currenIndex--;
        this.musics
        .then(music => {
            if(this.currenIndex < 0){
                this.currenIndex = music.length - 1;
            }
            this.loadCurrentSong();
        })
    },
    randomSong(){
        this.musics
        .then(music => {
            let newIndex;
            //dùng do..while bởi vì không muốn nó lặp lại bài cũ
            do {
                newIndex = Math.floor(Math.random() * music.length);
            } while(newIndex === this.currenIndex);
            this.currenIndex = newIndex;
            this.loadCurrentSong();
        })
    },
    definedProperties(){
        //định nghĩa phương thức lấy bài hát đầu tiên khi load trang vào thẻ audio
        Object.defineProperty(this, 'currentSong', {  // Object.defineProperty(tên object, tên property)
            get: function () {
                return fetch(getAPI)
                    .then(res => res.json())
                    .then(data => {
                        return data.data.song[this.currenIndex];
                    })
            }
        })
        Object.defineProperty(this, 'musics', {
            get: function () {
                return fetch(getAPI)
                    .then(res => res.json())
                    .then(data => {
                        return data.data.song;
                    })
            }
        })
    },
    loadCurrentSong(){
        this.currentSong
        .then(song => {
            audio.src = `http://api.mp3.zing.vn/api/streaming/audio/${song.id}/320`;
            controllPlayingTitle.innerHTML = song.name;
            controllThumbail.style.backgroundImage = `url(${song.thumbnail})`;
            $('title').innerHTML = song.name + ' - ' + song.performer;  
            $('link[rel="icon"]').href = song.thumbnail;
        })
    },
    //Auto trượt xuống nơi bài hát active
    scrollActiveSong(){
        // const songItem = document.querySelector(`.content-list-item[data-index="${this.currenIndex}"]`);
        const songItem = $('.content-list-item.active');
        if(songItem){
            songItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    },
    rankSong(){
        var day = new Date();
        var month = day.getMonth() + 1;
        var year = day.getFullYear();
        $('.rank-month').innerHTML = month;
        $('.rank-year').innerHTML = year;
    },
    loadConfig(){
        if(this.config){
            this.isRandom = this.config.isRandom;
            this.isRepeat = this.config.isRepeat;
        }
    },
    start(){
        this.loadConfig();
        this.definedProperties();
        this.handleEvent();
        this.loadCurrentSong();
        this.rankSong();
        this.getMusic(this.renderMusic);
        controllsRandom.classList.toggle('active',this.isRandom);
        controllsRedo.classList.toggle('active',this.isRepeat);
    }
}
app.start();