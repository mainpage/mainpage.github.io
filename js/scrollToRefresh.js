(function(){
  var startY, endY;
  var top = parseInt($('.container').css('top'));
  $('.content').on('touchstart', handleStart);
  function handleStart(e) {
    e = e.originalEvent;
    $('.scroll i').show();
    startY = e.targetTouches[0].pageY;
    $('.content').on('touchmove', handleMove);
    $('.content').on('touchend', handleEnd);
  }
  function handleMove(e) {
    e = e.originalEvent;
    var dist = e.targetTouches[0].pageY - startY;
    if(top+dist/5 <= 0){
     $('.container').css('top', top+dist/5+'px');
    }else{
    $('.container').css('top', 0);
     $('.scroll i').addClass('trans');
     $('.scroll span').text('释放更新');
    }
  }
  function handleEnd(e) {
    e = e.originalEvent;
    var currentTop = parseInt($('.container').css('top'));
    if(currentTop < 0){
      $('.container').css('top', top+'px');
      $('.scroll span').text('下拉刷新');
    }
    $('.scroll i').hide();
    $('.scroll i').removeClass('trans');
    $('.scroll span').text('加载中');
    $('.content').off('touchmove', handleMove);
    $('.content').off('touchend', handleEnd);
    setTimeout(function(){
      $('.container').css('top', top+'px');
      $('.scroll span').text('下拉刷新');
    }, 500);
  }
})();