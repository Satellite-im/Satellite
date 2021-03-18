<template>
   <div>
        <a href="#" class="prev" @click.prevent="onClickPrev">
            <img src="/static/assets/images/g4533.png" alt="" />
        </a>
        <div class="slider">
            <div 
                class="slick-slide" 
                :style="{transform: `translateX(${translate[index]}px)`}" 
                v-for="(slide, index) in slides" 
                :key="`${index}-slide`">
                <div class="avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="blank">
                    <h5 class="name">
                       {{ slide.name }}
                    </h5>
                    <h6 class="job">{{ slide.job }}</h6>
                    <div class="socials">
                        <a href="https://facebook.com/" class="social mr-2">
                            <i class="fab fa-facebook"></i>
                        </a>
                        <a href="https://twitter.com/" class="social mr-2">
                            <i class="fab fa-twitter-square"></i>
                        </a>
                        <a href="https://linkedin.com/" class="social mr-2">
                            <i class="fab fa-linkedin"></i>
                        </a>
                        <a href="https://github.com/" class="social">
                            <i class=" fab fa-github"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <a href="#" class="next" @click.prevent="onClickNext">
            <img src="/static/assets/images/g4532.png" alt="" />
        </a>
    </div>
</template>

<script>
export default {
   name: 'slider',

   data() {
       return {
           slides: [
               {
                   name: "Matt Wisniewski",
                   job: "Lead Developer",
               },
               {
                    name: "Matt Wisniewski",
                    job: "Lead Developer",
               },
               {
                    name: "Matt Wisniewski",
                    job: "Lead Developer",
               },
               {
                    name: "Matt Wisniewski",
                    job: "Lead Developer",
               },
               {
                    name: "Matt Wisniewski",
                    job: "Lead Developer",
               },
               {
                    name: "Matt Wisniewski",
                    job: "Lead Developer",
               }
           ],
           current: 0,
       }
   },

   computed: {
       translate() {
           return this.slides.map((item, index) => {
               return (index + (this.current * 100))
           })
       },
   },

   methods: {
       onClickPrev() {
           
           if(this.current != this.slides.length - 1) {
               this.current = this.current + 1;
           }
       },
       onClickNext() {
           if(this.current != 0) {
               this.current = this.current - 1;
           }
       },
   },
}
</script>

<style scoped>
.slider-wrapper .next,
.slider-wrapper .prev {
    width: 30px;
    height: 30px;
    display: inline-block;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transform-origin: center center;
    z-index: 1;
}

 .slider-wrapper .prev img,
.slider-wrapper .next img {
    object-fit: contain;
    width: 100%;
    height: 100%;
}
 .slider-wrapper .prev {
    left: 0px;
}

.slider-wrapper .next {
    right: 0px;
}

.slider-wrapper .slider {
    padding-right: 0;
    padding-left: 0;
}

.slider {
    display: flex;
    padding: 0 35px;
}

.slick-slide {
    width: 200px;
    height: 300px;
    border-radius: 10px;
    background-color: #e8e8fa;
    padding: 25px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    margin-right: 15px;
    transition: all .3s;
}

.slick-slide .avatar {
    width: 100px;
    height: 100px;
    background-color: #fff;
    border-radius: 50%;
    margin-bottom: 20px;
    color: #16161e;
    display: flex;
    justify-content: center;
    align-items: center;
}

.avatar i {
    font-size: 3rem;
}

.slick-slide .name {
    font-family: 'Space Mono', monospace;
    color: #16161e;
}

.slick-slide .job {
    text-align: center;
    font-size: 14px;
    position: relative;
}
.job:after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translate(-50%);
    background-color: #3a3870;
    height: 2px;
    width: 70px;
    border-radius: 5px;
    bottom: -5px;
}

.socials {
    margin-top: 15px;
    display: flex;
    justify-content: center;
}

.socials .social {
    color: #16161e;
}

.slider-wrapper {
    position: relative;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
}

@media (max-width: 768px) {

   .slider-wrapper .slider .slick-slide {
        margin-right: 30px;
        width: calc(100vw - 110px)
    }

    .slider-wrapper .prev {
        left: -8px;
    }
    
     .slider-wrapper .next {
        right: -8px;
    }
}

</style>