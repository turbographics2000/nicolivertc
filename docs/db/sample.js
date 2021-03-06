(function () {
    var COMPAT_ENVS = [
      ['Firefox', ">= 16.0"],
      ['Google Chrome',
       ">= 24.0 (you may need to get Google Chrome Canary), NO Blob storage support"]
    ];
    var compat = $('#compat');
    compat.empty();
    compat.append('<ul id="compat-list"></ul>');
    COMPAT_ENVS.forEach(function(val, idx, array) {
      $('#compat-list').append('<li>' + val[0] + ': ' + val[1] + '</li>');
    });
  
    const DB_NAME = 'mdn-demo-indexeddb-epublications';
    const DB_VERSION = 1; // この値は long long を使用します (float ではありません)
    const DB_STORE_NAME = 'publications';
  
    var db;  
  
    // ビューの無駄な再読み込みを避けるため、どのビューが表示されているかを追跡するために使用します
    var current_view_pub_key;
  
    function openDb() {
      console.log("openDb ...");
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onsuccess = function (evt) {
        // ガベージコレクションの問題を避けるため、結果を得る際は
        // "req" より "this" を使用する方がよい
        // db = req.result;
        db = this.result;
        console.log("openDb DONE");
      };
      req.onerror = function (evt) {
        console.error("openDb:", evt.target.errorCode);
      };
  
      req.onupgradeneeded = function (evt) {
        console.log("openDb.onupgradeneeded");
        var store = evt.currentTarget.result.createObjectStore(
          DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
  
        store.createIndex('biblioid', 'biblioid', { unique: true });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('year', 'year', { unique: false });
      };
    }
  
    /**
     * @param {string} store_name
     * @param {string} mode "readonly" または "readwrite"
     */
    function getObjectStore(store_name, mode) {
      var tx = db.transaction(store_name, mode);
      return tx.objectStore(store_name);
    }
  
    function clearObjectStore(store_name) {
      var store = getObjectStore(DB_STORE_NAME, 'readwrite');
      var req = store.clear();
      req.onsuccess = function(evt) {
        displayActionSuccess("Store cleared");
        displayPubList(store);
      };
      req.onerror = function (evt) {
        console.error("clearObjectStore:", evt.target.errorCode);
        displayActionFailure(this.error);
      };
    }
  
    function getBlob(key, store, success_callback) {
      var req = store.get(key);
      req.onsuccess = function(evt) {
        var value = evt.target.result;
        if (value)
          success_callback(value.blob);
      };
    }
  
    /**
     * @param {IDBObjectStore=} store
     */
    function displayPubList(store) {
      console.log("displayPubList");
  
      if (typeof store == 'undefined')
        store = getObjectStore(DB_STORE_NAME, 'readonly');
  
      var pub_msg = $('#pub-msg');
      pub_msg.empty();
      var pub_list = $('#pub-list');
      pub_list.empty();
      // 以前のコンテンツを表示しないようにするため、iframe をリセットします
      newViewerFrame();
  
      var req;
      req = store.count();
      // リクエストは、トランザクションに対して作成された順で実行され、
      // 結果も同じ順序で返されます。
      // よって、以下の計数は実際の pub のリストより前に表示されるかもしれません
      // (このケースでは、アルゴリズム的に重要ではありません)。
      req.onsuccess = function(evt) {
        pub_msg.append('<p>There are <strong>' + evt.target.result +
                       '</strong> record(s) in the object store.</p>');
      };
      req.onerror = function(evt) {
        console.error("add error", this.error);
        displayActionFailure(this.error);
      };
  
      var i = 0;
      req = store.openCursor();
      req.onsuccess = function(evt) {
        var cursor = evt.target.result;
  
        // カーソルが何かを指している場合に、データを要求します
        if (cursor) {
          console.log("displayPubList cursor:", cursor);
          req = store.get(cursor.key);
          req.onsuccess = function (evt) {
            var value = evt.target.result;
            var list_item = $('<li>' +
                              '[' + cursor.key + '] ' +
                              '(biblioid: ' + value.biblioid + ') ' +
                              value.title +
                              '</li>');
            if (value.year != null)
              list_item.append(' - ' + value.year);
  
            if (value.hasOwnProperty('blob') &&
                typeof value.blob != 'undefined') {
              var link = $('<a href="' + cursor.key + '">File</a>');
              link.on('click', function() { return false; });
              link.on('mouseenter', function(evt) {
                        setInViewer(evt.target.getAttribute('href')); });
              list_item.append(' / ');
              list_item.append(link);
            } else {
              list_item.append(" / No attached file");
            }
            pub_list.append(list_item);
          };
  
          // ストア内の次のオブジェクトに移動する
          cursor.continue();
  
          // このカウンタは、個別の ID を作成するためだけに使用する
          i++;
        } else {
          console.log("No more entries");
        }
      };
    }
  
    function newViewerFrame() {
      var viewer = $('#pub-viewer');
      viewer.empty();
      var iframe = $('<iframe />');
      viewer.append(iframe);
      return iframe;
    }
  
    function setInViewer(key) {
      console.log("setInViewer:", arguments);
      key = Number(key);
      if (key == current_view_pub_key)
        return;
  
      current_view_pub_key = key;
  
      var store = getObjectStore(DB_STORE_NAME, 'readonly');
      getBlob(key, store, function(blob) {
        console.log("setInViewer blob:", blob);
        var iframe = newViewerFrame();
  
        // 直接ダウンロードするという意味で、blob に
        // 直接リンクを設定することはできません。
        if (blob.type == 'text/html') {
          var reader = new FileReader();
          reader.onload = (function(evt) {
            var html = evt.target.result;
            iframe.load(function() {
              $(this).contents().find('html').html(html);
            });
          });
          reader.readAsText(blob);
        } else if (blob.type.indexOf('image/') == 0) {
          iframe.load(function() {
            var img_id = 'image-' + key;
            var img = $('<img id="' + img_id + '"/>');
            $(this).contents().find('body').html(img);
            var obj_url = window.URL.createObjectURL(blob);
            $(this).contents().find('#' + img_id).attr('src', obj_url);
            window.URL.revokeObjectURL(obj_url);
          });
        } else if (blob.type == 'application/pdf') {
          $('*').css('cursor', 'wait');
          var obj_url = window.URL.createObjectURL(blob);
          iframe.load(function() {
            $('*').css('cursor', 'auto');
          });
          iframe.attr('src', obj_url);
          window.URL.revokeObjectURL(obj_url);
        } else {
          iframe.load(function() {
            $(this).contents().find('body').html("No view available");
          });
        }
  
      });
    }
  
    /**
     * @param {string} biblioid
     * @param {string} title
     * @param {number} year
     * @param {string} url ダウンロードしてローカルの IndexedDB データベースに保存する
     *   画像の URL。この URL の背後にあるリソースは、"同一生成元ポリシー" に従います。
     *   よって、この方法を動作させるために URL は、このコードを配置する
     *   Web サイト/アプリと同一生成元であることが必要です。
     */
    function addPublicationFromUrl(biblioid, title, year, url) {
      console.log("addPublicationFromUrl:", arguments);
  
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      // 希望する responseType を "blob" に設定
      // http://www.w3.org/TR/XMLHttpRequest2/#the-response-attribute
      xhr.responseType = 'blob';
      xhr.onload = function (evt) {
        if (xhr.status == 200) {
          console.log("Blob retrieved");
          var blob = xhr.response;
          console.log("Blob:", blob);
          addPublication(biblioid, title, year, blob);
        } else {
          console.error("addPublicationFromUrl error:",
          xhr.responseText, xhr.status);
        }
      };
      xhr.send();
  
      // jQuery 1.8.3 では新しい "blob" responseType を扱わないため、
      // ここでは jQuery を使用できません。
      // http://bugs.jquery.com/ticket/11461
      // http://bugs.jquery.com/ticket/7248
      // $.ajax({
      //   url: url,
      //   type: 'GET',
      //   xhrFields: { responseType: 'blob' },
      //   success: function(data, textStatus, jqXHR) {
      //     console.log("Blob retrieved");
      //     console.log("Blob:", data);
      //     // addPublication(biblioid, title, year, data);
      //   },
      //   error: function(jqXHR, textStatus, errorThrown) {
      //     console.error(errorThrown);
      //     displayActionFailure("Error during blob retrieval");
      //   }
      // });
    }
  
    /**
     * @param {string} biblioid
     * @param {string} title
     * @param {number} year
     * @param {Blob=} blob
     */
    function addPublication(biblioid, title, year, blob) {
      console.log("addPublication arguments:", arguments);
      var obj = { biblioid: biblioid, title: title, year: year };
      if (typeof blob != 'undefined')
        obj.blob = blob;
  
      var store = getObjectStore(DB_STORE_NAME, 'readwrite');
      var req;
      try {
        req = store.add(obj);
      } catch (e) {
        if (e.name == 'DataCloneError')
          displayActionFailure("This engine doesn't know how to clone a Blob, " +
                               "use Firefox");
        throw e;
      }
      req.onsuccess = function (evt) {
        console.log("Insertion in DB successful");
        displayActionSuccess();
        displayPubList(store);
      };
      req.onerror = function() {
        console.error("addPublication error", this.error);
        displayActionFailure(this.error);
      };
    }
  
    /**
     * @param {string} biblioid
     */
    function deletePublicationFromBib(biblioid) {
      console.log("deletePublication:", arguments);
      var store = getObjectStore(DB_STORE_NAME, 'readwrite');
      var req = store.index('biblioid');
      req.get(biblioid).onsuccess = function(evt) {
        if (typeof evt.target.result == 'undefined') {
          displayActionFailure("No matching record found");
          return;
        }
        deletePublication(evt.target.result.id, store);
      };
      req.onerror = function (evt) {
        console.error("deletePublicationFromBib:", evt.target.errorCode);
      };
    }
  
    /**
     * @param {number} key
     * @param {IDBObjectStore=} store
     */
    function deletePublication(key, store) {
      console.log("deletePublication:", arguments);
  
      if (typeof store == 'undefined')
        store = getObjectStore(DB_STORE_NAME, 'readwrite');
  
      // 仕様書 http://www.w3.org/TR/IndexedDB/#object-store-deletion-operation によれば
      // Object Store Deletion Operation アルゴリズムの結果は undefined であり、
      // あるレコードが実際に削除されたかを、リクエストの結果を確認して
      // 知ることはできません。
      var req = store.get(key);
      req.onsuccess = function(evt) {
        var record = evt.target.result;
        console.log("record:", record);
        if (typeof record == 'undefined') {
          displayActionFailure("No matching record found");
          return;
        }
        // 警告: 削除するには、作成時に使用したものとまったく同じキーを使用しなければ
        // なりません。作成時のキーが数値であった場合は、削除時も数値でなければ
        // なりません。
        req = store.delete(key);
        req.onsuccess = function(evt) {
          console.log("evt:", evt);
          console.log("evt.target:", evt.target);
          console.log("evt.target.result:", evt.target.result);
          console.log("delete successful");
          displayActionSuccess("Deletion successful");
          displayPubList(store);
        };
        req.onerror = function (evt) {
          console.error("deletePublication:", evt.target.errorCode);
        };
      };
      req.onerror = function (evt) {
        console.error("deletePublication:", evt.target.errorCode);
      };
    }
  
    function displayActionSuccess(msg) {
      msg = typeof msg != 'undefined' ? "Success: " + msg : "Success";
      $('#msg').html('<span class="action-success">' + msg + '</span>');
    }
    function displayActionFailure(msg) {
      msg = typeof msg != 'undefined' ? "Failure: " + msg : "Failure";
      $('#msg').html('<span class="action-failure">' + msg + '</span>');
    }
    function resetActionStatus() {
      console.log("resetActionStatus ...");
      $('#msg').empty();
      console.log("resetActionStatus DONE");
    }
  
    function addEventListeners() {
      console.log("addEventListeners");
  
      $('#register-form-reset').click(function(evt) {
        resetActionStatus();
      });
  
      $('#add-button').click(function(evt) {
        console.log("add ...");
        var title = $('#pub-title').val();
        var biblioid = $('#pub-biblioid').val();
        if (!title || !biblioid) {
          displayActionFailure("Required field(s) missing");
          return;
        }
        var year = $('#pub-year').val();
        if (year != '') {
          // EcmaScript 6 エンジンでは use Number.isInteger を使用するとよい
          if (isNaN(year))  {
            displayActionFailure("Invalid year");
            return;
          }
          year = Number(year);
        } else {
          year = null;
        }
  
        var file_input = $('#pub-file');
        var selected_file = file_input.get(0).files[0];
        console.log("selected_file:", selected_file);
        // UI に入力されたファイルの値を取得したら UI をリセットする方法を参考として置きますが、
        // これを行うよりも HTML フォーム内の "reset" 型の
        // input を使用します。
        //file_input.val(null);
        var file_url = $('#pub-file-url').val();
        if (selected_file) {
          addPublication(biblioid, title, year, selected_file);
        } else if (file_url) {
          addPublicationFromUrl(biblioid, title, year, file_url);
        } else {
          addPublication(biblioid, title, year);
        }
  
      });
  
      $('#delete-button').click(function(evt) {
        console.log("delete ...");
        var biblioid = $('#pub-biblioid-to-delete').val();
        var key = $('#key-to-delete').val();
  
        if (biblioid != '') {
          deletePublicationFromBib(biblioid);
        } else if (key != '') {
          // EcmaScript 6 エンジンでは use Number.isInteger を使用するとよい
          if (key == '' || isNaN(key))  {
            displayActionFailure("Invalid key");
            return;
          }
          key = Number(key);
          deletePublication(key);
        }
      });
  
      $('#clear-store-button').click(function(evt) {
        clearObjectStore();
      });
  
      var search_button = $('#search-list-button');
      search_button.click(function(evt) {
        displayPubList();
      });
  
    }
  
    openDb();
    addEventListeners();
  
  })(); // Immediately-Invoked Function Expression (IIFE)