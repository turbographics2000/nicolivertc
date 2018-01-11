class IDB {
    constructor(options) {
        this._dbName = options.databaseName || 'saveData';
        this._dbVersion = options.databaseVersion || 1;
        this._storeName = options.storeName || 'data';
        this._keyPath = options.keyPath;
        this._autoIncrement = options.autoIncrement;
        this._db = null;
        this._store = null;
    }

    open() {
        return new Promise((resolve, reject) => {
            if (this._db) {
                resolve();
            } else {
                const req = indexedDB.open(this._dbName, this._dbVersion);
                req.onsuccess = evt => {
                    this._db = req.result;
                    resolve();
                };
                req.onupgradeneeded = evt => {
                    this._db = req.result;
                    this._store = req.result.createObjectStore(this._storeName, { keyPath: this._keyPath, autoIncrement: this._autoIncrement });
                    req.transaction.oncomplete = evt => {
                        resolve();
                    }
                };
                req.onerror = evt => {
                    reject(req.error);
                };
            }
        });
    }

    close() {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }

    deleteDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.deleteDatabase(this._dbName);
            req.onerror = evt => {
                reject(req.error);
            };
            req.onsuccess = evt => {
                resolve();
            };
        });
    }

    async put(data, storeName) {
        return new Promise((resolve, reject) => {
            storeName = storeName || this._storeName;
            if (!data) throw new Error('put no data');
            await this.open();
            const tx = this._db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            let err = null;
            const tx = store.transaction;
            tx.oncomplete = evt => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            };
            tx.onerror = evt => {
                reject(tx.error);
            };
            const req = store.put(data);
            req.onerror = evt => {
                err = req.error;
                err.data = data;
            }
            req.success = evt => {
                data[this._keyPath] = req.result;
            }
        });
    }

    async putAll(storeName, dataArray) {
        return new Promise((resolve, reject) => {
            if (!dataArray || dataArray.length === 0) {
                throw new Error('putAll no data');
            }
            if (!Array.isArray(dataArray)) {
                dataArray = [dataArray];
            }
            await this.open();
            const tx = this._db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            tx.oncomplete = evt => {
                resovle();
            };
            tx.onerror = evt => {
                reject(tx.error);
            };
            dataArray.forEach(data => {
                store.put(data);
            });
        });
    }

    async getOne(key) {
        return new Promise((resolve, reject) => {
            await this.open();
            const tx = req.transaction;
            let res = null;
            let err = null;
            tx.oncomplete = evt => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            };
            tx.onerror = evt => {
                reject(tx.error);
            };
            req.onsuccess = evt => {
                res = req.result;
            };
            req.onerror = evt => {
                err = req.error;
            };
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            await this.open();
            const tx = this._db.transaction(storeName);
            const store = tx.objectStore(storeName);
            let res = null;
            let err = null;
            tx.oncomplete = evt => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            };
            req = store.getAll();
            req.onsuccess = evt => {
                res = req.result;
            };
            req.onerror = evt => {
                err = req.error;
            };
        });
    }

    async deleteOne(storeName, key) {
        return new Promise((resolve, reject) => {
            await this.open();
            const tx = this._db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            let res = null;
            let err = null;
            tx.oncomplete = evt => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            };
            const req = store.delete(key);
            req.onsuccess = evt => {
                res = req.result;
            };
            req.onerror = evt => {
                err = req.error;
            };
        });
    }

    async deleteAll(storeName) {
        return new Promise((resolve, reject) => {
            await this.open();
            const tx = this._db.transaction(storeName, 'readwrite');
            const store = tx.objectStore();
            let res = null;
            let err = null;
            tx.oncomplete = evt => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            };
            tx.onerror = evt => {
                reject(tx.error);
            };
            const reqGetAllKeys = store.getAllKeys();
            let allKeys = null;
            reqGetAllKeys.onsuccess = evt => {
                allKeys = req.result;
            };
            reqGetAllKeys.onerror = evt => {
                err = req.error;
            };
            allKeys.forEach(key => {
                store.delete(key);
            });
        });
    }
}


let db = new IDB({
    dbName: 'saveData',
    dbVersion: 1,
    storeName: 'data',
    keyPath: 'id',
    autoIncrement: true,
});
db.deleteDB().then(_ => {
    db.put('hoge').catch(err => console.log(err));
});
