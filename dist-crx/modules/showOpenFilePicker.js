// deno-lint-ignore-file require-await constructor-super
/** @type {import('./showOpenFilePicker').Ponyfills} */
const { showOpenFilePicker, showSaveFilePicker } = globalThis.showOpenFilePicker ?? typeof document === 'object' ? (() => {
    const mapOfFiles = new WeakMap();
    const prototypeOfFileSystemHandle = FileSystemHandle.prototype;
    const prototypeOfFileSystemFileHandle = FileSystemFileHandle.prototype;
    document.createElement('a');

    const getFileHandle = file => {
        const fileHandle = {
            async getFile() { return file; }
        };//create(prototypeOfFileSystemFileHandle)
        mapOfFiles.set(fileHandle, file);
        return fileHandle
    };

    const getAcceptType = type => values(Object(type?.accept)).join(',');

    const { getOwnPropertyDescriptors, values } = Object;
    const { name, kind, ...descriptorsOfFileSystemHandle }  = getOwnPropertyDescriptors(prototypeOfFileSystemHandle);
    const { getFile, ...descriptorsOfFileSystemFileHandle } = getOwnPropertyDescriptors(prototypeOfFileSystemFileHandle);

    return {
        showOpenFilePicker(options = null) {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = ( options?.multiple ? true : false);
            input.accept = [].concat(options?.types ?? []).map(getAcceptType).join(',');
            const promise = new Promise((resolve, reject) => {
                input.addEventListener('change', () => {
                    resolve([...input.files].map(getFileHandle));
                    input.value = null;
                    input.files = null;
                }, { once: true });

                input.addEventListener('cancel', () => {
                    reject(new DOMException('The user aborted a request.'));
                }, { once: true });
            });
            input.click();
            return promise;
        },
        async showSaveFilePicker(options = null) {
            const accept = [].concat(
                Object.entries(
                    Object(
                        [].concat(options?.types ?? [])[0]?.accept
                    )
                )
            )[0] || ["text/plain", [".txt"]];

            return getFileHandle(
                new File(
                    [],
                    options?.suggestedName ?? 'Untitled' + (accept?.[1]?.[0] || '.txt'),
                    {
                        type: accept?.[0] || 'text/plain'
                    }
                )
            )
        },
    }
})() : {
    async showOpenFilePicker() {
        return []
    },
    async showSaveFilePicker() {
        return []
    },
};

export { showOpenFilePicker, showSaveFilePicker };
//# sourceMappingURL=showOpenFilePicker.js.map
