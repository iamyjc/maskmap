// 地圖初始化
var latitude = 25.0226;
var longitude = 121.5266;
var map = L.map('mapid').setView([latitude, longitude], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoon: 11,
    maxZoom: 19,
    attribution: 'Create by <a href="mail:yjc.ptt@gmail.com">YJC</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 取得使用者當前座標
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(showPosition);
}
function showPosition(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    console.log("取得地理位置，經度:"+latitude+" 緯度:"+longitude);
    // 座標移至使用者當前位置
    map.setView([latitude, longitude], 16);
    // 顯示使用者座標
    var myLocation = L.marker([latitude, longitude], {icon: blueIcon}).addTo(map).bindPopup("你在這裡").openPopup();
}

// 地圖標示初始化 (Leaflet color marks)
var greenIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
  

// 取得口罩資料
// https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json
// https://kiang.github.io/pharmacies/json/points.json
let getMask = new XMLHttpRequest();
    getMask.open('GET', 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', true);
    getMask.send(null);
    getMask.onload = () => {
        let getMaskData = JSON.parse(getMask.responseText);
        // console.table(getMaskData.features);

        // 搜尋藥局 function
        function search() {
            if (document.getElementById('search').value == '') {
                alert('請輸入關鍵字齁!');
                return
            };
            // 地圖回歸中心點
            map.setView([23.817844, 119.990917], 5);

            // 開始搜尋
            let result = '';
            let resultTotal = 0;
            for (let num = 0; num < getMaskData.features.length; num++) {
                if (getMaskData.features[num].properties.name.indexOf(document.getElementById('search').value) != -1) {
                    //console.log(getMaskData.features[num].properties.name);
                    result += '<a href="#" class="result-link d-block border" style="padding:2px 8px; margin:2px 0;" data-info="' + num + '">' + getMaskData.features[num].properties.name + '</a>';
                    resultTotal += 1;
                };
            };

            document.getElementById('search-result').innerHTML = '<div class="text-center" style="margin:16px 0 14px 0;">得到筆數 : ' + resultTotal + '</div>' + result;

            for (let x = 0; x < document.querySelectorAll('.result-link').length; x++) {
                document.querySelectorAll('.result-link')[x].addEventListener('click', () => {
                    //console.log(document.querySelectorAll('.result-link')[x].dataset.loa);
                    //console.log(document.querySelectorAll('.result-link')[x].dataset.geo);
                    //console.log(document.querySelectorAll('.result-link')[x].dataset.info);
                    map.setView([getMaskData.features[document.querySelectorAll('.result-link')[x].dataset.info].geometry.coordinates[1], getMaskData.features[document.querySelectorAll('.result-link')[x].dataset.info].geometry.coordinates[0]], 25);
                    markers[document.querySelectorAll('.result-link')[x].dataset.info].openPopup();
                });
            };
        };

        // 藥局資料
        let markers = [];
        for (var i = 0; i < getMaskData.features.length; i++) {
            // 內文
            infoStr =
                '<h1> ' + getMaskData.features[i].properties.name + '</h1>' +
                '<div class="border-bottom my-1">電話：<a href="tel:' + getPhoneNumber() + '">'+ getMaskData.features[i].properties.phone +'</a></div>' +
                '<div class="border-bottom">地址：' + getMaskData.features[i].properties.address +'</div>' +
                '<div> ▼ <a href="http://maps.google.com.tw/maps?q=' + getMaskData.features[i].properties.address + '">導航</a></div><br/>' +
                '<div class="border-bottom my-1">成人口罩數量：' + getMaskData.features[i].properties.mask_adult + '</div>' +
                '<div class="border-bottom">兒童口罩數量：' + getMaskData.features[i].properties.mask_child + '</div>' +
                '<div class="border-bottom my-1">備註：' + getMaskData.features[i].properties.note + '</div>';

            // 依庫存數量判定顏色
            // 紅色:庫存=0
            if (getMaskData.features[i].properties.mask_adult + getMaskData.features[i].properties.mask_child == 0) {
                circleMarkerOptions = {
                    weight: 2,
                    color: "red"
                };
                markers.push(L.circleMarker(getRandomLatLng(), circleMarkerOptions).addTo(map).bindPopup(infoStr));
                // L.marker(getRandomLatLng(), {icon: redIcon}).addTo(map).bindPopup(infoStr);
            // 黃色:庫存<50
            } else if (getMaskData.features[i].properties.mask_adult + getMaskData.features[i].properties.mask_child < 50) {
                circleMarkerOptions = {
                    weight: 2,
                    color: "orange"
                };
                markers.push(L.circleMarker(getRandomLatLng(), circleMarkerOptions).addTo(map).bindPopup(infoStr));
                // L.marker(getRandomLatLng(), {icon: yellowIcon}).addTo(map).bindPopup(infoStr);
            // 綠色:庫存>100
            } else {
                circleMarkerOptions = {
                    weight: 2,
                    color: "green"
                };
                markers.push(L.circleMarker(getRandomLatLng(), circleMarkerOptions).addTo(map).bindPopup(infoStr));
                // L.marker(getRandomLatLng(), {icon: greenIcon}).addTo(map).bindPopup(infoStr);
            };
        };

        // 取得電話號碼
        function getPhoneNumber(){
            return[
                getMaskData.features[i].properties.phone.replace(/ |-/g,"")
            ];
        }
        // 導航
        function goNavigation(){
            return[
                getMaskData.features[i].properties.phone.replace(/ |-/g,"")
            ];
        }
        // 取得座標
        function getRandomLatLng() {
            return [
                getMaskData.features[i].geometry.coordinates[1], getMaskData.features[i].geometry.coordinates[0]
            ];
        };
    }

// 地圖標示說明
L.Control.Watermark = L.Control.extend({
    onAdd: function(map) {
        let layer = L.DomUtil.create('div');
        layer.innerHTML =
            '<section class="info-board">' +
            '<div>口罩數為 0 : 紅標</div>' +
            '<div>口罩數小於 50 : 黃標</div>' +
            '<div>口罩數大於 100 : 綠標</div>' +
            '</section>';
        return layer;
    },
    onRemove: function(map) {
        // TODO
    }
});

L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
};

L.control.watermark({ position: 'bottomleft' }).addTo(map);
