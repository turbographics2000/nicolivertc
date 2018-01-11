export default class {
    constructor() {
    }

    createId() {
        return fetch(`https://skyway.io/${this.apiKey}/id?ts=${Date.now()}${Math.random()}`)
            .then(res => res.text())
            .then(id => {
                this.id = id;
                return id;
            });
    }

    getPeerList() {
        return fetch(`https://skyway.io/active/list/${this.apiKey}`)
            .then(res => res.json())
            .then(list => {
                this.peerList = list;
                return list;
            });
    }

    openSignalingChannel(sc) {
        var sc = new WebSocket(`wss://skyway.io/peerjs?key=${apiKey}&id=${myId}&token=${token}`);
        sc.onopen = function () {
            console.log('signalingChannelSetup on open');
        }
        sc.onmessage = function (evt) {
            let that = this;
            let msg = JSON.parse(evt.data);
            console.log('%cRecieve message', 'color: white; background: #f89e41; padding: 1px', 'type:' + msg.type, msg);
            if (!pc && msg.src) {
                console.log('pcSetup', 'remoteId:' + msg.src, msg);
                pcSetup(msg.src);
            }
            if (msg.type === 'OFFER') {
                if (msg.originalMessage) {
                    this.originalMessageProcess;
                    return;
                }
                if (msg.branchData) {
                    window.branchData = msg.branchData;
                    return;
                }
                console.log('%cRecieve offer', 'color: #229933', msg.ofr);
                pc.setRemoteDescription(new RTCSessionDescription(msg.ofr))
                    .then(_ => {
                        console.log('%cCreate answer', 'color: #229933');
                        return pc.createAnswer();
                    })
                    .then(answer => {
                        console.log('%csetLocalDescription(answer)', 'color: #229933', answer);
                        return pc.setLocalDescription(answer);
                    })
                    .then(_ => {
                        console.log('%cSend answer', 'color:white; background: red; padding: 1px', 'dst:' + pc.remoteId, pc.localDescription);
                        socket.send(JSON.stringify({
                            type: 'ANSWER',
                            ans: pc.localDescription,
                            dst: pc.remoteId
                        }));
                    })
                    .catch(ex => {
                        console.log('Recieve Offer error.', ex);
                    });
            } else if (msg.type === 'ANSWER') {
                console.log('%cRecieve answer', msg.ans);
                pc.setRemoteDescription(new RTCSessionDescription(msg.ans))
                    .catch(ex => {
                        console.log('Recieve Answer error.', ex);
                    });
            } else if (msg.type === 'CANDIDATE' && msg.cnd) {
                console.log('%cRecieve candidate', 'color: red', msg.cnd);
                pc.addIceCandidate(new RTCIceCandidate(msg.cnd))
                    .catch(ex => {
                        console.log('Recieve Candidate error.', ex);
                    });
            } else if (msg.type === 'LEAVE') {
                util.log('Received leave message from', peer);
                this._cleanupPeer(peer);
            } else if (msg.type === 'PING') {
                console.log('%cSend ping', 'color:white; background: red; padding: 1px;');
                that.send(JSON.stringify({ type: 'PONG' }));
            }
        }
        sc.onclose = function (evt) {
            console.log('socket onclose', JSON.stringify(evt));
        }
        sc.onerror = function (evt) {
            console.log('socket error', evt);
        }
    }

    pcSetup(remoteId, offerOption = null) {
        var pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.skyway.io:3478' }] });
        pc.remoteId = remoteId;
        pc.onicecandidate = function (evt) {
            console.log('%cpc onicecandidate', 'background: #79b74a; font-weight: bold; padding: 1px;');
            console.log('%cSend candidate', 'color:white; background: red; padding: 1px;', 'dst:' + pc.remoteId, evt.candidate);
            socket.send(JSON.stringify({
                type: 'CANDIDATE',
                cnd: evt.candidate,
                dst: pc.remoteId
            }));
        }
        pc.onnegotiationneeded = function (evt) {
            console.log('%cpc onnegotiationneeded', 'background: #5d76a7; color: white; font-weight: bold; padding: 1px;');
            console.log('creaate offer');
            pc.createOffer(offerOption)
                .then(offer => {
                    console.log('setLocalDescription(offer)', offer)
                    return pc.setLocalDescription(offer);
                })
                .then(_ => {
                    console.log('%cSend offer', 'color:white; background: red; padding: 1px', 'dst:' + pc.remoteId, pc.localDescription);
                    socket.send(JSON.stringify({
                        type: 'OFFER',
                        ofr: pc.localDescription,
                        dst: pc.remoteId
                    }));
                });
        }
        if ('ontrack' in pc) {
            pc.ontrack = function (evt) {
                if (evt.track.kind === 'video') {
                    evt.streams.forEach(stream => {
                        createVideoElm(remoteViewContainer, stream);
                    })
                }
            }
        } else {
            pc.onaddstream = function (evt) {
                console.log('%cpc onaddstream', 'background: #ea4335, font-weight: bold; padding: 1px;');
                createVideoElm(remoteViewContainer, evt.stream);
            }
        }
        pc.oniceconnectionstatechange = function () {
            switch (pc.iceConnectionState) {
                case 'failed':
                    util.log('iceConnectionState is disconnected, closing connections to ' + peerId);
                    connection.close();
                    break;
                case 'completed':
                    pc.onicecandidate = util.noop;
                    break;
            }
        };
        return pc;
    }

    addTrack(track, stream, remoteId) {
        if (this.oneByOnePC) {
            pcs[remoteId] = pc[remoteId] || {};
            if (!pcs[remoteId][stream.id]) {
                pcs[remoteId][stream.id] = this.pcSetup(remoteId);
            }
        } else {

        }
        var pc = remoteId ? this.pcs[remoteId] : this.pc;
        pc.addTrack(track, stream);
    }

    scSend(remoteId, data) {
        this.signalingChannel.send(JSON.stringify({ type: 'OFFER', originalMessage: { data: data }, dst: remoteId }));
    }

    send(remoteId, label, data) {
        this.dcs[remoteId][label].send(data);
    }

    close(remoteId) {
        var pcClose = pc => {
            if (!!pc && (pc.readyState !== 'closed' || pc.signalingState !== 'closed')) {
                pc.lose();
            }
        }
        var getPC = rId => {
            if (this.oneByOnePC) {
                Object.keys(this.pcs[rId]).forEach(connectionId => {
                    var pc = this.pcs[rId][connectionId];
                    pcClose(pc);
                });
            } else {
                var pc = this.pcs[rId];
                pcClose(pc);
            }
        }

        if (remoteId) {
            getPC(remoteId);
        } else {
            Object.keys(this.pcs).forEach(remoteId => {
                getPC(remoteId);
            });
        }

        if (this.sc && this.sc.readyState === 1) {
            this.sc.close();
        }
    }
}

