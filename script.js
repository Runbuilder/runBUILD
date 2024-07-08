// 전역 변수 초기화
const allData = {}; // 모든 시트의 데이터를 저장할 객체
const sheetNames = []; // 시트 이름을 저장할 배열
let editor = ''; // Ace 에디터 인스턴스를 저장할 변수
const sheetIds = [
  '1dCPa8dvEZIoOCyZ2pAhgs4axVbZqmL1eEuk8F5XlsqQ',
  '1LpfDp6k9I9NicYYbY6kVuwC9pnWfR3ZkQO244fUgFy4',
  '1lm6PBfknRsKXEbsIodyqKWv_rA7HGhy6su7M1erBUGc'
]; // Google 스프레드시트 ID 배열
const scriptURLs = [
  'AKfycbzNIBs_4ZjRDL3ku6tvFhoSKRynZD3YPfcAIeUxQzZ1eu2dZWt55TwVzqf9yNM-7L-eQw',
  'AKfycbw42YJxlqlcIQI1QlD-REoXUe4yM_oNRbx-TS9N-w4aE1_vmu23Kg2LnJ3N5oFPkymu',
  'AKfycbwcORA5QLM0RD8ae8794P4-jJsjssU9DXvVN5qxbduU-kaB_gQ0A9_86UuZG2Vqzydq'
]; // Google Apps Script 웹 앱 URL 배열
let language = 'ko'; // 언어 설정 (한국어)

let responseElement = '';//편집창에 최초 보여질 코드
let dataLoaded = [false, false, false]; // 각 섹션의 데이터 로드 상태를 추적하는 배열
const card1datas = [];
const card2datas = [];
const card3datas = []; 
const getDatas = [card1datas, card2datas, card3datas];
let selectData = [];

// 3개의 섹션의 데이터를 가져와서 card1datas, card2datas, card3datas에 데이터 저장하는 함수
async function getDataForSections() {
  for (let i = 0; i < 3; i++) {
    try {
      const URL = `https://script.google.com/macros/s/${encodeURIComponent(scriptURLs[i])}/exec?sn=${encodeURIComponent(sheetIds[i])}`;
      const response = await fetch(URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Google Apps Script 호출 실패, HTTP 상태 코드: ${response.status}`);
      }

      const data = await response.json();
      if (!sheetNames[i]) {
        sheetNames[i] = data.sheetNames[0];
      }

      const sheetURL = `https://script.google.com/macros/s/${encodeURIComponent(scriptURLs[i])}/exec?sn=${encodeURIComponent(sheetIds[i])}&param=${encodeURIComponent(1)}`;
      const sheetResponse = await fetch(sheetURL, { mode: 'cors' });
      const sheetData = await sheetResponse.json();
      getDatas[i] = sheetData.data;
      dataLoaded[i] = true;
    } catch (error) {
      console.error(`Google Apps Script 호출 실패 (섹션 ${i + 1}):`, error);
    }
  }
}

// DOM이 완전히 로드되면 실행되는 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
  // Ace 에디터 초기화 및 설정
  editor = ace.edit('editor');//HTML 문서 내의 'editor'라는 ID를 가진 요소를 변수로 설정
  editor.session.setMode("ace/mode/html"); // HTML 모드로 설정
  editor.setTheme("ace/theme/monokai"); // 테마 설정
  editor.session.setOptions({
    tabSize: 2,
    useSoftTabs: true
  });
  editor.setValue(responseElement, -1); // 초기 HTML 템플릿 설정
  fetchFileContent('runCode.txt');
  // 각 카드 섹션에 대한 클릭 이벤트 리스너 설정
  document.getElementById('card1').addEventListener('click', () => showCardSection('card1'));
  document.getElementById('card2').addEventListener('click', () => showCardSection('card2'));
  document.getElementById('card3').addEventListener('click', () => showCardSection('card3'));

  // 모든 뒤로 가기 버튼에 이벤트 리스너 설정
  document.querySelectorAll('.backButton').forEach(button => {
    button.addEventListener('click', hideCardSections);
  });

  // 페이지 로드 시 데이터 가져오기
  getDataForSections();

  // 에디터 크기 조절 이벤트 리스너
  const editorContainer = document.querySelector('.editorContainer');
  editorContainer.addEventListener('mousedown', initResize, false);
});
function initResize(e) {
  window.addEventListener('mousemove', Resize, false);
  window.addEventListener('mouseup', stopResize, false);
}

function Resize(e) {
  const editorContainer = document.querySelector('.editorContainer');
  editorContainer.style.height = (e.clientY - editorContainer.offsetTop) + 'px';
  editor.resize(); // Ace Editor 크기 조정
}

function stopResize(e) {
  window.removeEventListener('mousemove', Resize, false);
  window.removeEventListener('mouseup', stopResize, false);
}

// 로딩 스피너를 표시하는 함수
function showLoadingSpinner(section) {
  document.getElementById(`loading-spinner-${section}`).style.display = 'flex';
}

// 로딩 스피너를 숨기는 함수
function hideLoadingSpinner(section) {
  document.getElementById(`loading-spinner-${section}`).style.display = 'none';
}

// 특정 카드 섹션을 표시하는 함수
function showCardSection(cardId) {
  document.querySelector(`.${cardId}-section`).style.display = 'block'; // 선택된 카드 섹션 표시
  hideOtherSections(); // 다른 섹션 숨기기
  const sectionIndex = parseInt(cardId.slice(-1)) - 1; // 카드 ID에서 섹션 인덱스 추출
  showLoadingSpinner(sectionIndex + 1); // 로딩 스피너 표시

  // 데이터가 로드되었는지 확인
  if (dataLoaded[sectionIndex]) {
    selectData = getDatas[sectionIndex];
    dataShow(selectData, sectionIndex + 1);
    hideLoadingSpinner(sectionIndex + 1);
  } else {
    // 데이터가 아직 로드되지 않았다면 로드
    getDataForSection(sectionIndex + 1);
  }
}

// 모든 카드 섹션을 숨기는 함수
function hideCardSections() {
  document.querySelectorAll('.card1-section, .card2-section, .card3-section').forEach(section => {
    section.style.display = 'none';
  });
  showOtherSections(); // 다른 섹션들 표시
}

// 카드 섹션 외의 다른 섹션들을 숨기는 함수
function hideOtherSections() {
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });
}

// 카드 섹션 외의 다른 섹션들을 표시하는 함수
function showOtherSections() {
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'block';
  });
}

// 특정 섹션의 데이터를 가져오는 비동기 함수
async function getDataForSection(sectionIndex) {
  try {
    // Google Apps Script URL 생성 및 데이터 요청
    const URL = `https://script.google.com/macros/s/${encodeURIComponent(scriptURLs[sectionIndex - 1])}/exec?sn=${encodeURIComponent(sheetIds[sectionIndex - 1])}`;
    const response = await fetch(URL, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Google Apps Script 호출 실패, HTTP 상태 코드: ${response.status}`);
    }

    const data = await response.json();
    // 시트 이름이 없으면 첫 번째 시트 이름 사용
    if (!sheetNames[sectionIndex - 1]) {
      sheetNames[sectionIndex - 1] = data.sheetNames[0];
    }

    // 시트 데이터 요청
    const sheetURL = `https://script.google.com/macros/s/${encodeURIComponent(scriptURLs[sectionIndex - 1])}/exec?sn=${encodeURIComponent(sheetIds[sectionIndex - 1])}&param=${encodeURIComponent(1)}`;
    const sheetResponse = await fetch(sheetURL, { mode: 'cors' });
    const sheetData = await sheetResponse.json();
    getDatas[sectionIndex - 1] = sheetData.data;

    dataLoaded[sectionIndex - 1] = true; // 데이터 로드 상태 업데이트
    selectData = getDatas[sectionIndex - 1];
    dataShow(selectData, sectionIndex); // 데이터 표시
  } catch (error) {
    console.error(`Google Apps Script 호출 실패 (섹션 ${sectionIndex}):`, error);
  } finally {
    hideLoadingSpinner(sectionIndex); // 로딩 스피너 숨기기
  }
}

function dataShow(dataArray, sectionIndex) {
  const cardContainer = document.getElementById(`cardContainer-${sectionIndex}`);
  cardContainer.innerHTML = ''; // 기존 내용 초기화
  let selectedCard = null;

  dataArray.forEach((item) => {
    // 각 데이터 항목에 대한 카드 생성
    const card = document.createElement('div');
    card.className = 'card';
    if (sectionIndex === 3) {
      card.innerHTML = `
        <img src="${item[4]}" alt="${item[1]}">
        <div class="card-content">
          <p class="card-description">${item[2]}</p>
        </div>
      `;
    } else {
      card.innerHTML = `
        <img src="${item[4]}" alt="${item[1]}">
        <div class="card-content">
          <p class="card-title">${item[1]}</p>
        </div>
      `;
    }

    // 카드 클릭 이벤트 리스너
    card.addEventListener('click', function() {
      if (sectionIndex === 3) {
        // 섹션 3의 경우 새 탭에서 링크 열기
        window.open(item[3], '_blank');
      } else {
        // 다른 섹션의 경우 에디터에 코드 표시
        editor.setValue(item[3].toString());

        // 선택된 카드 스타일 변경
        if (selectedCard) {
          selectedCard.classList.remove('selected-card');
        }
        card.classList.add('selected-card');
        selectedCard = card;

        // 추가 정보가 있는 경우 팝업으로 표시
        if (item[4] && item[4].toString().trim() !== '') {
          // Markdown을 HTML로 변환
          const converter = new showdown.Converter();
          const html = converter.makeHtml(item[2].toString());

          // SweetAlert2 옵션 설정
          let swalOptions = {
            title: item[1],
            html: html,
            customClass: {
              title: 'swal2-title',
              content: 'custom-content-class'
            }
          };

          // 섹션별로 다른 버튼 설정
          if (sectionIndex === 1) {
            swalOptions = {
              ...swalOptions,
              showDenyButton: true,
              showCancelButton: true,
              confirmButtonText: '코드복사',
              denyButtonText: '코드실행',
              cancelButtonText: '닫기'
            };
          } else if (sectionIndex === 2) {
            swalOptions = {
              ...swalOptions,
              showCancelButton: true,

              confirmButtonText: '코드복사',
                cancelButtonText: '닫기'
            };
          }

          // SweetAlert2를 사용하여 팝업 표시
          Swal.fire(swalOptions).then((result) => {
            if (result.isConfirmed) {
              // 'Copy' 버튼 클릭 시
              navigator.clipboard.writeText(item[3].toString())
                .then(() => {
                  Swal.fire('Copied!', 'App Script 코드가 클립보드에 복사되었습니다.', 'success');
                })
                .catch((error) => {
                  console.error('Failed to copy item[3] to clipboard:', error);
                  Swal.fire('Oops!', 'Failed to copy item[3] to clipboard.', 'error');
                });
            } else if (result.isDenied) {
              if (sectionIndex === 1) {
                // 섹션 1의 경우 'Run' 버튼 클릭 시 코드 실행
                const code = editor.getValue();
                if (code.length === 0) return;
                runCode(code);
              } else if (sectionIndex === 2) {
                // 섹션 2의 경우 'Close' 버튼 클릭 시 팝업 닫기
                Swal.close();
              }
            }
            // 'Close' 버튼 클릭 시 (result.dismiss === Swal.DismissReason.cancel)
            // 아무 작업 없이 팝업이 닫힘
          });
        }
      }
    });

    cardContainer.appendChild(card);
  });
}

// 코드를 새 창에서 실행하는 함수
function runCode(code) {
  const newWindow = window.open("", "_blank");
  newWindow.document.open();
  newWindow.document.write(code);
  newWindow.document.close();
}


// 상태 관리 변수
let runTF = true; // 코드 실행 가능 여부
let pwaTF = false; // PWA 모드 활성화 여부
let pwaVal = ""; // PWA 관련 값 저장
let exam = true; // 예제 모드 여부
let buttonsCreated = false; // 버튼 생성 완료 여부


// 'Run' 버튼 클릭 이벤트 리스너
const runBuild = document.querySelector('#runBuild');
runBuild.addEventListener('click', () => {
  const code = editor.getValue();
  if (code.length === 0) return;
  runCode(code);
}); 

// Manifest 버튼 이벤트 리스너
const manifest = document.querySelector('#manifest');
manifest.addEventListener('click', () => {
  runTF = false;
  fetchFileContent('manifest.js');
});

// Service Workers 버튼 이벤트 리스너
const serviceWorkers = document.querySelector('#serviceWorkers');
serviceWorkers.addEventListener('click', () => {
  runTF = false;
  fetchFileContent('serviceWorker.js');
});

// Save 버튼 이벤트 리스너
const save = document.querySelector('#save');
save.addEventListener('click', () => { downloadFile(editor.getValue()) });

// PWA 버튼 이벤트 리스너
const pwa = document.querySelector('#pwa');
pwa.addEventListener('click', () => {
  runTF = true;
  const code1 = editor.getValue();
  const parser = new DOMParser();
  const doc = parser.parseFromString(code1, "text/html");
  if (pwaTF) {
    editor.setValue(pwaVal);
    return;
  }
  const head = doc.head;
  const body = doc.body;

  // PWA 관련 요소 추가
  const manifestLink = document.createElement("link");
  manifestLink.setAttribute("rel", "manifest");
  manifestLink.setAttribute("href", "/manifest.json");
  const script = document.createElement("script");
  script.innerHTML = `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./serviceWorker.js')
          .then(registration => {
            console.log('Service worker registered:', registration);
          })
          .catch(error => {
            console.log('Service worker registration failed:', error);
          });
      });
    }
  `;

  head.appendChild(manifestLink);
  body.appendChild(script);

  editor.setValue(doc.documentElement.outerHTML);
  pwaVal = doc.documentElement.outerHTML;
  pwaTF = true;
});

// 파일 다운로드 함수
function downloadFile(value) {
  if (value.length < 10) return;
  let extension, fileName, fileType;
  if (value.startsWith('{')) {
    extension = 'json';
    fileName = 'manifest.json';
    fileType = 'application/json';
  } else if (value.startsWith('const')) {
    extension = 'js';
    fileName = 'serviceWorkers.js';
    fileType = 'application/javascript';
  } else {
    extension = 'html';
    fileName = 'index.html';
    fileType = 'text/html';
  }

  const blob = new Blob([value], { type: fileType });
  const a = document.createElement('a');
  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.click();
}

// 파일 내용을 가져오는 비동기 함수
async function fetchFileContent(file) {
  try {
    const response = await fetch(file);
    if (response.ok) {
      const fileContent = await response.text();
      editor.setValue(fileContent);
    } else {
      console.error('Failed to fetch file:', file);
    }
  } catch (error) {
    console.error('Error fetching file:', error);
  }
}