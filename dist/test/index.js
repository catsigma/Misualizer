"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const PsBABY5H_1 = require("tezbridge-network/PsBABY5H");
const client = new PsBABY5H_1.default({
    host: 'https://alphanet-node.tzscan.io'
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const contract = client.fetch.contract('KT18brAGvbtX8UGsKTAVex5k63YbZTYNzhpv');
        console.log(contract);
    });
}
main();
