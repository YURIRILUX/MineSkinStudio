document.addEventListener('DOMContentLoaded', () => {
    generateUUID('pack-uuid');
    generateUUID('module-uuid');
    const skinFileInput = document.getElementById('skin-image');
    skinFileInput.addEventListener('change', handleFileSelect);

    document.addEventListener('contextmenu', function(event) {
        if (event.target.tagName !== 'INPUT' || event.target.type !== 'text') {
            event.preventDefault();
        }
    });

    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('dragstart', event => event.preventDefault());
    });

    const createButton = document.getElementById('create-skinpack-button');
    if (createButton) {
        createButton.addEventListener('click', createSkinPack);
    }
});

//スキンデータの配列
let skinData = [];

//UUIDを生成する関数
function generateUUID(elementId) {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    document.getElementById(elementId).value = uuid;
}

//スキン画像を選択する処理
function handleFileSelect(event) {
    const files = event.target.files;
    const container = document.getElementById('skinPreview');

    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const skinInfo = document.createElement('div');
            skinInfo.classList.add('skin-settings');

            const newSkinData = {
                id: skinData.length,
                name: '',
                armType: 'default',
                animationType: false,
                hideArmor: false,
                file: file,
                imgSrc: e.target.result,
                cape: null
            };
            skinData.push(newSkinData);

            skinInfo.innerHTML = `
            <div class="skin-info-container">
                <img src="${newSkinData.imgSrc}" alt="Skin Preview" class="skin-preview" style="width:64px; height:64px; margin-right:10px;">
                <div class="skin-details">
                    <input type="text" placeholder="スキン名を入力" data-id="${newSkinData.id}" class="skin-name short-input">
                    <div class="combo-container">
                        <div>
                            <label for="arm-type-${newSkinData.id}">腕のタイプ:</label>
                            <select id="arm-type-${newSkinData.id}" data-id="${newSkinData.id}" class="arm-type">
                                <option value="default">デフォルト</option>
                                <option value="slim">スリム</option>
                            </select>
                        </div>
                        <div>
                            <label for="animation-${newSkinData.id}">ゾンビ化:</label>
                            <select id="animation-${newSkinData.id}" data-id="${newSkinData.id}" class="animation-type">
                                <option value="false" selected>いいえ</option>
                                <option value="true">はい</option>
                            </select>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" id="hide-armor-${newSkinData.id}" data-id="${newSkinData.id}" class="hide-armor"> 防具を非表示
                            </label>
                        </div>
                    </div>
                    <div class="cape-upload">
                        <label for="cape-upload-${newSkinData.id}" class="cape-upload-label">マント画像を選択</label>
                        <input type="file" id="cape-upload-${newSkinData.id}" accept="image/png">
                        <div id="capePreview-${newSkinData.id}" class="cape-preview"></div>
                    </div>
                    <button type="button" class="delete-skin" data-id="${newSkinData.id}">🗑️</button>
                </div>
            </div>`;
        container.appendChild(skinInfo);

            const capeUpload = skinInfo.querySelector('.cape-upload');
            capeUpload.style.display = 'block';

            const deleteButton = skinInfo.querySelector('.delete-skin');
            deleteButton.addEventListener('click', function () {
                const skinId = parseInt(this.getAttribute('data-id'));
                if (confirm('このスキンを削除しますか？')) {
                    deleteSkin(skinId);
                }
            });

            updateSkinData(newSkinData.id, e.target.result, file);

            const capeInput = skinInfo.querySelector(`#cape-upload-${newSkinData.id}`);
            capeInput.addEventListener('change', (e) => handleCapeSelect(e, newSkinData.id));
        };
        reader.readAsDataURL(file);
    });
}

function handleCapeSelect(event, skinId) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const capePreviewContainer = document.querySelector(`#capePreview-${skinId}`);
        capePreviewContainer.innerHTML = `<img src="${e.target.result}" alt="Cape Preview">`;

        const skin = skinData.find(s => s.id === skinId);
        skin.cape = file;
    };
    reader.readAsDataURL(file);
}

function updateSkinData(id, imgSrc, file) {
    const skin = skinData.find(s => s.id === id);
    skin.imgSrc = imgSrc;
    skin.file = file;
    const skinNameInput = document.querySelector(`input.skin-name[data-id="${id}"]`);
    const armTypeSelect = document.querySelector(`select.arm-type[data-id="${id}"]`);
    const animationTypeSelect = document.querySelector(`select.animation-type[data-id="${id}"]`);
    const hideArmorCheckbox = document.querySelector(`input.hide-armor[data-id="${id}"]`);
    skinNameInput.addEventListener('input', () => skin.name = skinNameInput.value);
    armTypeSelect.addEventListener('change', () => skin.armType = armTypeSelect.value);
    animationTypeSelect.addEventListener('change', () => skin.animationType = animationTypeSelect.value === 'true');
    hideArmorCheckbox.addEventListener('change', () => skin.hideArmor = hideArmorCheckbox.checked);
}

function deleteSkin(id) {
    skinData = skinData.filter(skin => skin.id !== id);
    const skinElement = document.querySelector(`.skin-settings input[data-id="${id}"]`).closest('.skin-settings');
    skinElement.remove();
}

function createSkinPack() {
    const packName = document.getElementById('pack-name').value.trim();
    const packUUID = document.getElementById('pack-uuid').value.trim();
    const moduleUUID = document.getElementById('module-uuid').value.trim();

    if (packName === '' || skinData.some(skin => skin.name === '')) {
        alert('スキンパックの名前とスキンの名前を入力してください');
        return;
    }

    const manifest = {
        format_version: 1,
        header: {
            name: packName,
            uuid: packUUID,
            version: [1, 0, 0],
        },
        modules: [
            {
                type: "skin_pack",
                uuid: moduleUUID,
                version: [1, 0, 0],
            }
        ]
    };

    const skinsJson = {
        skins: skinData.map((skin, index) => ({
            localization_name: skin.name,
            geometry: skin.armType === 'default' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
            texture: `skin_${index}.png`,
            cape: skin.cape ? `cape_${index}.png` : undefined,
            type: "free",
            animations: skin.animationType ? {
                "move.arms": "animation.player.move.arms.zombie"
            } : undefined,
            hide_armor: skin.hideArmor
        })),
        serialize_name: packName,
        localization_name: packName
    };

    const enUsLangContent = skinData.map(skin => `skin.${packName}.${skin.name}=${skin.name}`).join('\n') +
        `\nskinpack.${packName}=${packName}`;

    const geometryJson = {
      "geometry.HDcape1": {
        "texturewidth": 128,
        "textureheight": 128,
        "visible_bounds_width": 17,
        "visible_bounds_height": 3,
        "visible_bounds_offset": [0, 0, 0],
        "bones": [
          {
            "name": "root",
            "pivot": [0, 0, 0]
          },
          {
            "name": "waist",
            "parent": "root",
            "pivot": [0, 12, 0]
          },
          {
            "name": "body",
            "parent": "waist",
            "pivot": [0, 24, 0],
            "cubes": [
              {"origin": [-4, 12, -2], "size": [8, 12, 4], "uv": [16, 16]}
            ]
          },
          {
            "name": "head",
            "parent": "body",
            "pivot": [0, 24, 0],
            "cubes": [
              {"origin": [-4, 24, -4], "size": [8, 8, 8], "uv": [0, 0]}
            ]
          },
          {
            "name": "hat",
            "parent": "head",
            "pivot": [0, 24, 0],
            "cubes": [
              {"origin": [-4, 24, -4], "size": [8, 8, 8], "uv": [32, 0], "inflate": 0.5}
            ]
          },
          {
            "name": "cape",
            "parent": "body",
            "pivot": [0, 24, 2],
            "rotation": [0, 180, 0],
            "cubes": [
              {"origin": [-5, 8, 1], "size": [10, 16, 1], "uv": [106, 0]},
              {"origin": [-67, -54, -61.1], "size": [134, 140, 0], "uv": [1, 33], "inflate": -62}
            ]
          },
          {
            "name": "rightArm",
            "parent": "body",
            "pivot": [-5, 22, 0],
            "cubes": [
              {"origin": [-8, 12, -2], "size": [4, 12, 4], "uv": [40, 16]}
            ]
          },
          {
            "name": "rightSleeve",
            "parent": "rightArm",
            "pivot": [-5, 22, 0],
            "cubes": [
              {"origin": [-8, 12, -2], "size": [4, 12, 4], "uv": [56, 16], "inflate": 0.25}
            ]
          },
          {
            "name": "rightItem",
            "parent": "rightArm",
            "pivot": [-6, 15, 1]
          },
          {
            "name": "jacket",
            "parent": "body",
            "pivot": [0, 24, 0],
            "cubes": [
              {"origin": [-4, 12, -2], "size": [8, 12, 4], "uv": [72, 16], "inflate": 0.25}
            ]
          },
          {
            "name": "leftArm",
            "parent": "body",
            "pivot": [5, 22, 0],
            "cubes": [
              {"origin": [4, 12, -2], "size": [4, 12, 4], "uv": [40, 16], "mirror": true}
            ]
          },
          {
            "name": "leftSleeve",
            "parent": "leftArm",
            "pivot": [5, 22, 0],
            "cubes": [
              {"origin": [4, 12, -2], "size": [4, 12, 4], "uv": [56, 16], "inflate": 0.25}
            ]
          },
          {
            "name": "leftItem",
            "parent": "leftArm",
            "pivot": [6, 15, 1]
          },
          {
            "name": "leftLeg",
            "parent": "root",
            "pivot": [1.9, 12, 0],
            "cubes": [
              {"origin": [-0.1, 0, -2], "size": [4, 12, 4], "uv": [0, 16], "mirror": true}
            ]
          },
          {
            "name": "leftPants",
            "parent": "leftLeg",
            "pivot": [1.9, 12, 0],
            "cubes": [
              {"origin": [-0.1, 0, -2], "size": [4, 12, 4], "uv": [64, 0], "inflate": 0.25}
            ]
          },
          {
            "name": "rightLeg",
            "parent": "root",
            "pivot": [-1.9, 12, 0],
            "cubes": [
              {"origin": [-3.9, 0, -2], "size": [4, 12, 4], "uv": [0, 16]}
            ]
          },
          {
            "name": "rightPants",
            "parent": "rightLeg",
            "pivot": [-1.9, 12, 0],
            "cubes": [
              {"origin": [-3.9, 0, -2], "size": [4, 12, 4], "uv": [64, 0], "inflate": 0.25}
            ]
          }
        ]
      }//参考:Hypelexity
    };

    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("skins.json", JSON.stringify(skinsJson, null, 2));
    zip.folder("texts").file("en_US.lang", enUsLangContent);
    zip.file('geometry.json', JSON.stringify(geometryJson, null, 2));

    const imagePromises = skinData.map((skin, index) => {
        const skinFilePromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                zip.file(`skin_${index}.png`, e.target.result.split(',')[1], { base64: true });
                resolve();
            };
            reader.readAsDataURL(skin.file);
        });

        const capeFilePromise = skin.cape ? new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                zip.file(`cape_${index}.png`, e.target.result.split(',')[1], { base64: true });
                resolve();
            };
            reader.readAsDataURL(skin.cape);
        }) : Promise.resolve();

        return Promise.all([skinFilePromise, capeFilePromise]);
    });

    Promise.all(imagePromises).then(() => {
        zip.generateAsync({ type: "blob" }).then((content) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'SkinPack.zip';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }).catch(error => console.error("Error generating zip file:", error));
}

document.addEventListener('DOMContentLoaded', () => {
    const starsContainer = document.querySelector('.stars');
    const numberOfStars = 200;

    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
    
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 100}vh`; 
        star.style.left = `${Math.random() * 100}vw`;
        
        starsContainer.appendChild(star);
    }
});
