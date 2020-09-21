//Nav 디자인

function SetMenu(menu) {
    const navList = document.querySelectorAll("nav li");  // querySelectorAll은 배열
    navList.forEach(function (navList) {                         // 배열에 forEach 사용하여 각 요소에 작동
        navList.classList.remove("on");
        document.querySelector("nav li." + menu).classList.add("on");
        document.querySelector("main").className = menu;
    })
};

//sort(정렬), filter(필터)

let sorts = {
    recent: function (a, b) { return (a.idx > b.idx) ? -1 : 1 },  // 최신순 정렬
    like: function (a, b) { return (a.likes > b.likes) ? -1 : 1 }, // 좋아요순 정렬
}
let sort = sorts.recent; // 최신순, 좋아요순 등 변경 가능

/* Javascipt 필터링  -> firebase 서버를 이용하여 필터링하는 것으로 변경
let filters = {
    all: function (it) { return true; },
    mine: function (it) { return it.user_id === my_info.id; },
    like: function (it) { return my_info.like.indexOf(it.idx) > -1; },
    follow: function (it) { return my_info.follow.indexOf(it.user_id) > -1; },
}
*/


// firebase에서 필터링(https://firebase.google.com/docs/firestore/query-data/order-limit-data?authuser=0)
let filterName = 'all'

let getFilterParams = {
    all: function () { return ['idx', '>', 0] },
    mine: function () { return ['user_id', '==', my_info.id] },
    like: function () { return ['idx', 'in', my_info.like] },
    follow: function () { return ['user_id', 'in', my_info.follow] }
  };

function setSort(_sort) {
    document.querySelectorAll("#sorts li").forEach(function (sortLi) {
        sortLi.classList.remove("on")
    });
    document.querySelector("#sorts li." + _sort).classList.add("on");
    sort = sorts[_sort];
    showPhotos();
}

function setFilter(_filter) {
    document.querySelectorAll("#filters li").forEach(function (filterLi) {
        filterLi.classList.remove("on")
    })
    document.querySelector("#filters li." + _filter).classList.add("on");
    filterName = _filter
    loadphotos();
}

// 사진올리기 onkeyup 

function SetDescLength() {
    document.querySelector(".descLength").innerHTML =
        document.querySelector("input.description").value.length + "/20"
}

// 데이터 입력 'data.js'에 있는 객체 데이터를 입력(my_info)
function showMyInfo() {
    document.querySelector("#myInfoId").innerHTML = my_info.id;
    document.querySelector("#myInfoUserName").innerHTML = my_info.user_name;
    document.querySelector("#sp-intro").innerHTML = my_info.introduction;
    document.querySelector("#ip-intro").value = my_info.introduction;
    document.querySelector("#myinfo input[type=radio][value=" + my_info.as + "]").checked = true;
    document.querySelectorAll("#myinfo input[type=checkbox]")
        .forEach(function (checkbox) {
            checkbox.checked = false;
        });
    my_info.interest.forEach(function (interest) {
        document.querySelector(
            "#myinfo input[type=checkbox][value=" + interest + "]"
        ).checked = true;
    });

}

//수정버튼으로 데이터 수정
function setEditMyInfo(on) {
    document.querySelector("#myinfo > div").className = on ? "edit" : "non-edit"
    document.querySelectorAll("#myinfo input").forEach(function (input) {
        input.disabled = !on;   //input.disabled = on 인경우(div의 className이 "edit")에 disabled 제거   
    })
    showMyInfo();
}

// 웹에서 변경한 데이터를 DB로 전송
function updateInfo() {
    my_info.introduction = document.querySelector("#ip-intro").value;
    my_info.as = document.querySelector("#myinfo input[type=radio]:checked").value;
    const interests = [];
    document.querySelectorAll("#myinfo input[type=checkbox]:checked").forEach(function (checkbox) {
        interests.push(checkbox.value);
        my_info.interest = interests;

        setEditMyInfo(false);  // class Name "non-edit"로 변경(수정불가)
        updateMyInfoOnDB();
    })
};

// 사진보기

function showPhotos() {
    const existingNodes = document.querySelectorAll("article:not(.hidden)"); // class가 hidden이 아닌 article   
    existingNodes.forEach(function (existingNodes) {
        existingNodes.remove();
    })

    const gallery = document.querySelector(".photos");

    let filtered = photos;
        filtered.sort(sort);  

    filtered.forEach(function (photo) {   //입력되는 'photo' 는 배열 photos(data.js)의 오브젝트 
        const photoNode = document.querySelector(".hidden").cloneNode(true);  // class가 hidden인 article 노드 복제 
        photoNode.classList.remove("hidden");
        photoNode.querySelector(".author").innerHTML = photo.user_name;  //(중요) photo는 photos의 객체이며, 객체에서 user_name 값 입력
        photoNode.querySelector(".desc").innerHTML = photo.description;
        photoNode.querySelector(".photo").style.backgroundImage = "url('" + photo.url + "')";  // url 경로 사진 입력

        photoNode.querySelector(".like").innerHTML = photo.likes;
        if (my_info.like.indexOf(photo.idx) > -1) {      // my_info에 있는 like애 있는 숫자에 해당 되는 div(like)의 class에 'on' 추가
            photoNode.querySelector(".like").classList.add("on");  //indexOf 함수 사용시 배열안에 그 값이 있다면 그 값을 출력, 없으면 '-1'를 출력
        }
        if (my_info.follow.indexOf(photo.user_id) > -1) {
            const followSpan = document.createElement("span");
            followSpan.innerHTML = "FOLLOW"
            photoNode.querySelector(".author").append(followSpan);
          }

        gallery.append(photoNode);
        photoNode.querySelector(".like").addEventListener(
            "click", function () { toggleLike(photo.idx) }
        )
        photoNode.querySelector(".author").addEventListener(
            "click", function () { toggleFollow(photo.user_id) }
          )
          function toggleFollow (user_id) {
            if (my_info.follow.indexOf(user_id) === -1) {
              my_info.follow.push(user_id);
            } else {
              my_info.follow = my_info.follow.filter(
                function (it) { return it !== user_id; }
              );
            }
            db.collection("my_info").doc(my_info.docId).update({
              follow: my_info.follow
            }).then(function () {
              init();
            });
          }
          
          
    }
    )
};

// 토글

function toggleLike(idx) {
    if (my_info.like.indexOf(idx) === -1) {  // 하트가 클릭되어 있지 않았을 경우,
        my_info.like.push(idx);
        for (let i = 0; i < photos.length; i++) {  // like 값 1 증가
            if (photos[i].idx === idx) {
                photos[i].likes++;
                toggleLikeOnDB(photos[i]);
                break;
            }
        }
    } else {
        my_info.like = my_info.like.filter(    // it값과 idx값이 다를 경우, 그 값만 필터를 통과시켜 준다. 즉, 
            function (it) { return it !== idx; }  // return이 true인 값만으로 배열 만들기
        );
        for (let i = 0; i < photos.length; i++) { // like 값 1 감소
            if (photos[i].idx === idx) {
                photos[i].likes--;
                toggleLikeOnDB(photos[i]);
                break;
            }
        }

    }
//    showPhotos();
}

function toggleLikeOnDB (photo) {
    db.collection("my_info").doc(my_info.docId).update({
      like: my_info.like
    }).then(function () {
      db.collection("photos").doc(String(photo.idx)).update({
        likes: photo.likes
      }).then(function () {
        init();
      });
    });
  }
  

// 화면에 처음 로드되면 실행되는 함수, body / onload
function init() {
    loadMyInfo();
    loadphotos();
}

function loadMyInfo() {
    db.collection("my_info").get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            my_info = doc.data();
            my_info.docId = doc.id;  // docId = GCXTEcq45vKe4WE73vSe
            showMyInfo();
        })
    })
}

// 웹에서 서버의 데이터 수정(updateInfo 함수)
function updateMyInfoOnDB() {
    db.collection("my_info").doc(my_info.docId).update({
        introduction: my_info.introduction,
        as: my_info.as,
        interest: my_info.interest
    }).then(function () {
        loadMyInfo();
    })
}

// 파일 업로드(Storage) 
function uploadFile() {
    let file = document.querySelector("input[type=file]").files[0];   // files[0] 여러개의 파일의 경우 하나의 파일만 선택
    let ref = storage.ref().child(file.name);
    ref.put(file).then(function (snapshot) {
        snapshot.ref.getDownloadURL().then(function (url) {
            uploadPhotoInfo(url);
        })
    });
}

// 업로드하여 서버에 저장
function uploadPhotoInfo(url) {
    let photoInfo = {
        idx: Date.now(),
        url: url,
        user_id: my_info.id,
        user_name: my_info.user_name,
        description: document.querySelector("input.description").value,
        likes: Math.round(Math.random() * 10)
    }

    db.collection("photos").doc(String(photoInfo.idx)).set(photoInfo)
        .then(function () {
            console.log("Success!");
            SetMenu('gallery')    // <main>의 class name 변경 -> 화면 전환 
            loadphotos();
        })
        .catch(function (error) {       // 실행이 제대로 되지않을 경우 catch 사용
            console.error("Error!", error);
        });
}

function loadphotos() {
    db.collection("photos").where(
        getFilterParams[filterName]()[0],
        getFilterParams[filterName]()[1],
        getFilterParams[filterName]()[2]
    ).get().then(function (querySnapshot) {
        let photosArray = []
        querySnapshot.forEach(function (doc) {
            photosArray.push(doc.data())
        })
        photos = photosArray;
        showPhotos();
    });
}

  


