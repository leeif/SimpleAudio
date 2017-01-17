function SimplePlayer(option) {
  this.songList = option.songList ? option.songList : [];
  //use in song index in list
  this.compare = option.compare;
  this.mode = option.mode;
  this.audio = null;
  this.currentSong = null;
  this.listener = {};
}

SimplePlayer.prototype.setOnSongLoadListener = function(listener) {
  this.listener.onSongLoad = listener;
};

SimplePlayer.prototype.setOnPlayPauseListener = function(listener) {
  this.listener.onPlayPause = listener;
};

SimplePlayer.prototype.setOnProgressListener = function(listener) {
  this.listener.onProgress = listener;
};

SimplePlayer.prototype.setOnMetaLoadedListener = function(listener) {
  this.listener.onMetaLoaded = listener;
};

SimplePlayer.prototype.setOnSongRemoveListener = function(listener) {
  this.listener.onSongRemove = listener;
};

SimplePlayer.prototype.setOnSongListChangeListener = function(listener) {
  this.listener.onSongListChange = listener;
};

SimplePlayer.prototype.setOnEndedListener = function(listener) {
  this.listener.onEnded = listener;
};

SimplePlayer.prototype.insertSongList = function(list) {
  var i;
  for (i = list.length - 1; i >= 0; i--) {
    this.songList.unshift(list[i]);
  }
  if (this.listener.onSongListChange) {
    this.listener.onSongListChange(this.songList);
  }
  //play first song in list
  this.load();
};

SimplePlayer.prototype.removeSong = function(mid) {
  var position = this.compare({ mid: mid }, this.songList);
  if (mid == this.currentSong.mid && this.songList.length > 1) {
    this.next();
  }
  this.songList.splice(position, 1);
  if (this.listener.onSongRemove) {
    this.listener.onSongRemove(this.currentSong, this.songList);
  }
};

SimplePlayer.prototype.load = function(song) {
  console.log('load music');
  if (this.songList.length === 0) {
    return;
  }
  if (typeof song === 'number') {
    var index = this.compare({ mid: song }, this.songList);
    this.currentSong = index != -1 ? this.songList[index] : this.songList[0];
  } else {
    this.currentSong = song ? song : this.songList[0];
  }
  if (this.audio && !this.audio.paused) {
    //stop current song
    this.audio.pause();
    this.audio = null;
    if (this.listener.onEnded) {
      this.listener.onEnded();
    }
  }
  this.audio = new Audio(this.currentSong.url);
  this.setAudioListener();
  if (this.listener.onSongLoad) {
    this.listener.onSongLoad(this.currentSong);
  }
  this.playpause();
};

SimplePlayer.prototype.setAudioListener = function() {
  //load metadata
  var self = this;
  this.audio.onloadedmetadata = function() {
    var meta = {
      duration: timeConvert(self.audio.duration),
      cover: self.currentSong.cover,
      author: self.currentSong.author,
      album: self.currentSong.album,
      title: self.currentSong.title,
    };
    if (self.listener.onMetaLoaded) {
      self.listener.onMetaLoaded(meta);
    }
  };

  //progress
  this.audio.ontimeupdate = function() {
    if (self.listener.onProgress) {
      self.listener.onProgress({
        percent: self.audio.currentTime / self.audio.duration * 100,
        rest: timeConvert(self.audio.duration - self.audio.currentTime)
      });
    }
  };

  this.audio.onended = function() {
    if (self.listener.onEnded) {
      self.listener.onEnded();
    }
    self.next();
  };
};

SimplePlayer.prototype.playpause = function() {
  if (this.listener.onPlayPause) {
    this.listener.onPlayPause(this.audio.paused);
  }
  if (this.audio && !this.audio.paused) {
    console.log('pause');
    this.audio.pause();
  } else if (this.audio && this.audio.paused) {
    console.log('play');
    this.audio.play();
  }
};

SimplePlayer.prototype.next = function() {
  var nextIndex = 0;
  if (this.compare) {
    nextIndex = (this.compare(this.currentSong, this.songList) + 1) % this.songList.length;
  }
  this.load(this.songList[nextIndex]);
};

SimplePlayer.prototype.preview = function() {
  var previewIndex = 0;
  if (this.compare) {
    previewIndex = (this.compare(this.currentSong, this.songList) - 1) % this.songList.length;
  }
  if (previewIndex < 0) {
    previewIndex = this.songList.length - 1;
  }
  this.load(this.songList[previewIndex]);
};

SimplePlayer.prototype.seek = function(percent) {
  if (this.audio) {
    this.audio.currentTime = this.audio.duration * percent;
  }
};

SimplePlayer.prototype.volume = function(volume) {
  if (this.audio) {
    this.audio.volume = volume;
  }
};

function timeConvert(time) {
  var min;
  var sec;
  min = Math.floor(time / 60);
  min = min >= 10 ? '' + min : '0' + min;
  sec = Math.floor(time % 60);
  sec = sec >= 10 ? '' + sec : '0' + sec;
  return min + ':' + sec;
}

if(typeof define === 'function') {
  define([], function(){
    return {
      SimplePlayer: SimplePlayer
    };
  });
}
