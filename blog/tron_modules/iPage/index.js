(function(a){if(typeof exports=="object"||typeof exports==="function"&&typeof module=="object"){module.exports=a()}else{if(typeof define=="function"&&define.amd){return define([],a)}else{window.pagination=a()}}})(function(){var a=new Class(function(d,b,c){this.compile(d,b,c)});a.add("compile",function(e,c,d){var b={};d=d||9;if(e<1){e=1}if(c<1){c=1}if(c>e){c=e}if(d>e){d=e}if(d<1){d=1}var f=0,i=0;if((d-1)%2===1){f=Math.floor((d-1)/2);if(f<1){f=1}i=f+1}else{f=i=(d-1)/2}var h=0,g=0;h=c-f;g=c+i;if(h<1){h=1;g=d}else{if(g>e){g=e;form=e-d+1}}b.from=h;b.to=g;b.first=1;b.last=e;b.prev=c-1<1?1:c-1;b.next=c+1>e?e:c+1;b.limits=d;b.index=c;this.value=b});a.add("toArray",function(){var c=[];for(var b=this.value.from;b<=this.value.to;b++){c.push(b)}return c});return a});