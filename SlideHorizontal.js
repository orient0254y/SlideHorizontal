(function(document, window) {
    function SlideHorizontal(id) {
        if (!(id).trim()) return;
        this.id = id;
        this.xArray = [];
        this.obj = $("#" + this.id).get(0);
        this.mouseStart = 0;
        this.clickable = true;
        this.init();
    }
    SlideHorizontal.prototype = {
        init: function() {
            this.cellSwitch();
            var canControl = this.setStyle();
            if (canControl) this.controls();
        },
        //设置样式
        setStyle: function() {
            var totalWidth = 0;
            var height = 0;
            $("#" + this.id).addClass("unselectable");
            $("#" + this.id).children().each(function() {
                totalWidth += $(this).width() +
                    parseFloat($(this).css("margin-left")) +
                    parseFloat($(this).css("margin-right")) +
                    parseFloat($(this).css("padding-left")) +
                    parseFloat($(this).css("padding-right")) +
                    parseFloat($(this).css("border-left-width")) +
                    parseFloat($(this).css("border-right-width"));
                if (!height) height = $(this).height();
            });
            $("#" + this.id).css({ "width": (totalWidth + 2) + "px", "height": height + "px" });
            var style = $('<style type="text/css"></style>');
            var css = '.unselectable {user-select: none;-o-user-select: none;-moz-user-select: none;-webkit-user-select: none;}';
            style.html(css);
            $("#" + this.id).parent().prepend(style);
            // 给所有拥有此class的标签定义不能被选属性
            $(".unselectable").attr({
                "onselectstart": "return false;",
                "unselectable": "on"
            });
            return this.afterClick();
        },
        controls: function() {
            var scope = this;
            $("#" + this.id).on("touchstart", function(e) {
                scope.moveStart(e);
                $(this).off("mousedown");
                $(this).off("mousemove");
                $(document).off("mouseup");
            });
            $("#" + this.id).on("touchmove", function(e) {
                scope.move(e);
            });
            $("#" + this.id).on("touchend", function(e) {
                scope.moveEnd(e);
            });

            $("#" + this.id).on("mousedown", function(e) {
                scope.mouseStart = 1;
                scope.moveStart(e);
            });
            $("#" + this.id).on("mousemove", function(e) {
                if (scope.mouseStart === 1) {
                    scope.move(e);
                }
            });
            $(document).on("mouseup", function(e) {
                scope.moveEnd(e);
                scope.mouseStart = 2;
            });
        },
        moveStart: function(e) {
            var e = e || window.event;
            clearInterval(this.timer);
            clearInterval(this.timerBack);
            clearInterval(this.timerOut);
            if (e.clientX) {
                this.startX = e.clientX;
                this.startY = e.clientY;
            } else {
                var touch = e.originalEvent.changedTouches[0];
                this.startX = touch.clientX;
                this.startY = touch.clientY;
            }
            this.xArray.push({
                "x": this.startX,
                "t": (new Date()).getTime()
            });
            this.originX = this.getTranslateX();
        },
        move: function(e) {
            var e = e || window.event;
            if (e.clientX) {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            } else {
                var touch = e.originalEvent.changedTouches[0];
                this.mouseX = touch.clientX;
                this.mouseY = touch.clientY;
            }

            if (this.direction !== "vertical" && this.direction !== "horizontal") {
                if (Math.abs(this.mouseY - this.startY) > Math.abs(this.mouseX - this.startX)) {
                    this.direction = "vertical";
                    return false;
                } else {
                    this.direction = "horizontal";
                }
            }
            var switchDirection = false;
            if (this.direction === "horizontal") {
                e.preventDefault();
                var dx = this.mouseX - this.startX;
                if (this.originX + dx > 0) {
                    var newTranslateX = (this.originX + dx) / this.wrapperWidth * 10;
                } else if (this.originX + dx < this.maxTranslateX) {
                    var newTranslateX = (this.originX + dx - this.maxTranslateX) / this.wrapperWidth * 5 + this.maxTranslateX;
                } else {
                    var newTranslateX = this.originX + dx
                }
                this.setTranslateX(newTranslateX);
                this.xArray.push({
                    "x": this.mouseX,
                    "t": (new Date()).getTime()
                });
                for (var i = 0; i < this.xArray.length - 2; i++) {
                    var k = i + 2;
                    var j = i + 1;
                    if ((this.xArray[k].x - this.xArray[j].x) * (this.xArray[j].x - this.xArray[i].x) < 0) {
                        switchDirection = true;
                        this.xArray = [];
                        this.xArray.push({
                            "x": this.mouseX,
                            "t": (new Date()).getTime()
                        });
                        break;
                    }
                }
                switchDirection = false;
            }

        },
        moveEnd: function(e) {
            var e = e || window.event;
            if (e.clientX) {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                if (Math.sqrt(Math.pow((this.mouseY - this.startY), 2) + Math.pow((this.mouseX - this.startX), 2)) < 1) {
                    this.clickable = true;
                } else {
                    this.clickable = false;
                }
            } else {
                var touch = e.originalEvent.changedTouches[0];
                this.mouseX = touch.clientX;
                this.mouseY = touch.clientY;
            }
            this.xArray.push({
                "x": this.mouseX,
                "t": (new Date()).getTime()
            });
            if (this.xArray.length === 2) {
                return;
            }
            this.speed = (this.xArray[this.xArray.length - 1].x - this.xArray[0].x) / (this.xArray[this.xArray.length - 1].t - this.xArray[0].t);
            this.slowDown();
            this.direction = null;
            this.xArray = [];
        },
        slowDown: function() {
            var kSpeed = this.speed; //px/ms
            var lastTranslateX = this.getTranslateX();
            var minSpeed = 0.002;
            if (lastTranslateX > 0) {
                this.boundBack(0);
            } else if (lastTranslateX < this.maxTranslateX) {
                this.boundBack(this.maxTranslateX);
            } else {
                if (Math.abs(kSpeed) > minSpeed) {
                    var scope = this;
                    var a = 0.001 * Math.abs(kSpeed) / kSpeed;
                    var t = kSpeed / a;
                    var dt = 0;
                    this.timer = setInterval(function() {
                        dt += 10;
                        var s = kSpeed * dt - (1 / 2) * a * dt * dt;
                        var v = kSpeed - a * dt;
                        if (v * kSpeed < 0) {
                            clearInterval(scope.timer);
                        } else {
                            var newTranslateX = lastTranslateX + s;
                            if (newTranslateX > 0) {
                                scope.boundOut(0);
                                clearInterval(scope.timer);
                            } else if (newTranslateX < scope.maxTranslateX) {
                                scope.boundOut(scope.maxTranslateX);
                                clearInterval(scope.timer);
                            } else {
                                scope.setTranslateX(newTranslateX);
                            }
                        }
                    }, 10);
                }
            }
        },
        boundOut: function(boundTranslateX) {
            // 最大距离5px
            if (boundTranslateX === 0) {
                var speed = 0.04;
            } else {
                var speed = -0.04;
            }
            var boundDis = 10;
            var t = boundDis / (Math.abs(speed) / 2);
            var a = speed / t;
            var dt = 0;
            var scope = this;
            this.timerOut = setInterval(function() {
                dt += 10;
                var s = speed * dt + 1 / 2 * a * dt * dt;
                if (Math.abs(s) >= boundDis) {
                    clearInterval(scope.timerOut);
                    scope.boundBack(boundTranslateX);
                } else {
                    scope.setTranslateX(boundTranslateX + s);
                }
            }, 10);
        },
        boundBack: function(boundTranslateX) {
            if (boundTranslateX === 0) {
                var speed = 0.04;
            } else {
                var speed = -0.04;
            }
            var translateX = this.getTranslateX();
            var scope = this;
            var dt = 0;
            this.timerBack = setInterval(function() {
                dt += 10;
                var s = speed * dt;
                var newTranslateX = translateX - s;
                if (Math.abs(newTranslateX - boundTranslateX) <= 1) {
                    clearInterval(scope.timerBack);
                    scope.setTranslateX(boundTranslateX);
                } else {
                    scope.setTranslateX(newTranslateX);
                }
            }, 10);
        },
        afterClick: function() {
            var totalWidth = $("#" + this.id).width();
            var wrapperWidth = $("#" + this.id).parent().width();
            this.wrapperWidth = wrapperWidth;
            var activeOne = $("#" + this.id).find(".active");
            var halfLeftWidth = (wrapperWidth - (activeOne.width() +
                parseFloat(activeOne.css("margin-left")) +
                parseFloat(activeOne.css("margin-right")) +
                parseFloat(activeOne.css("padding-left")) +
                parseFloat(activeOne.css("padding-right")) +
                parseFloat(activeOne.css("border-left-width")) +
                parseFloat(activeOne.css("border-right-width")))) / 2;
            if (totalWidth > wrapperWidth) {
                this.maxTranslateX = wrapperWidth - totalWidth;
                var originTranslateX = activeOne.offset().left - $("#" + this.id).offset().left;
                if (totalWidth - originTranslateX + halfLeftWidth > wrapperWidth) {
                    if (originTranslateX < halfLeftWidth) {
                        this.setTranslateX(0);
                    } else {
                        this.setTranslateX(-originTranslateX + halfLeftWidth);
                    }
                } else {
                    this.setTranslateX(wrapperWidth - totalWidth);
                }
                return true;
            } else {
                this.setTranslateX(0);
                this.maxTranslateX = 0;
                return false;
            }
        },
        setTranslateX: function(tx) {
            $(this.obj).css({
                "transform": "translate(" + tx + "px,0px)",
                "webkitTransform": "translate(" + tx + "px,0px)",
                "mozTransform": "translate(" + tx + "px,0px)",
                "msTransform": "translate(" + tx + "px,0px)",
                "oTransform": "translate(" + tx + "px,0px)"
            });
        },
        getTranslateX: function() {
            var matrix = $(this.obj).css("transform") || $(obj).css("webkitTransform");
            return parseFloat(matrix.split("(")[1].split(")")[0].split(", ")[4]);
        },
        // 单元切换
        cellSwitch: function() {
            var scope = this;
            $("#" + this.id).children().each(function() {
                $(this).click(function() {
                    if (scope.clickable) {
                        $(this).addClass("active").siblings().removeClass('active');
                        scope.afterClick();
                        scope.xArray = [];
                    }
                });
            });
        }
    }
    window.SH = SlideHorizontal;
})(document, window);