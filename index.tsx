// DOM Elements
const jsonInput = document.getElementById('json-input') as HTMLTextAreaElement;
const generateFormBtn = document.getElementById('generate-form-btn') as HTMLButtonElement;
const beautifyBtn = document.getElementById('beautify-btn') as HTMLButtonElement;
const validateBtn = document.getElementById('validate-btn') as HTMLButtonElement;
const updateJsonBtn = document.getElementById('update-json-btn') as HTMLButtonElement;
const visualEditor = document.getElementById('visual-editor') as HTMLDivElement;
const inputMessageArea = document.getElementById('input-message-area') as HTMLDivElement;
const outputControlsArea = document.getElementById('output-controls-area') as HTMLDivElement;
const visualEditorPlaceholder = document.getElementById('visual-editor-placeholder') as HTMLParagraphElement;

// Modal Elements
const modal = document.getElementById('info-modal') as HTMLDivElement;
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
const modalBody = document.getElementById('modal-body') as HTMLDivElement;
const modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement;
const footerLinks = document.querySelectorAll('footer a');
const headerLinks = document.querySelectorAll('.header-nav a');


// --- Modal Content ---
const modalContent = {
    privacy: {
        title: 'Privacy Policy',
        content: `
            <p>Your privacy is important to us. This Visual JSON Editor is a client-side tool, which means all of your data processing happens directly in your browser.</p>
            <p><strong>No data, including the JSON you paste or edit, is ever sent to or stored on our servers.</strong> Everything stays on your local machine.</p>
            <p>We do not use cookies or tracking technologies. Your session is completely private and anonymous.</p>
        `
    },
    terms: {
        title: 'Terms of Service',
        content: `
            <p>By using this Visual JSON Editor, you agree to the following terms:</p>
            <p><strong>1. As-Is Service:</strong> This tool is provided "as is" without any warranties. We are not liable for any data loss or corruption that may occur.</p>
            <p><strong>2. No Guarantees:</strong> While we strive for accuracy, we cannot guarantee that the generated JSON will be perfect or suitable for all purposes. Always validate your data for critical applications.</p>
            <p><strong>3. Responsible Use:</strong> You agree not to use this service for any illegal or malicious activities.</p>
        `
    },
    support: {
        title: 'Support',
        content: `
            <p>If you encounter any issues or have suggestions for improvement, we would love to hear from you.</p>
            <p>Please reach out to our support team via email:</p>
            <p><strong>yennares@gmail.com</strong></p>
            <p>We will do our best to assist you as soon as possible.</p>
        `
    }
};

// --- Modal Logic ---
const openModal = (target: 'privacy' | 'terms' | 'support') => {
    const { title, content } = modalContent[target];
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.style.display = 'flex';
};

const closeModal = () => {
    modal.style.display = 'none';
};

footerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target') as 'privacy' | 'terms' | 'support';
        if (target && modalContent[target]) {
            openModal(target);
        }
    });
});

headerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target') as 'privacy' | 'terms' | 'support';
        if (target && modalContent[target]) {
            openModal(target);
        }
    });
});

modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});


// --- Helper Functions ---

/**
 * Displays a message to the user in the input panel.
 * @param text - The message to display.
 * @param type - The type of message ('success' or 'error').
 */
const showMessage = (text: string, type: 'success' | 'error') => {
    inputMessageArea.innerHTML = '';
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    inputMessageArea.appendChild(messageDiv);
};

/** Gets a default value for a given type. */
const getDefaultValue = (type: string): any => {
    switch (type) {
        case 'string': return '';
        case 'number': return 0;
        case 'boolean': return false;
        case 'object': return {};
        case 'array': return [];
        default: return null;
    }
}

/** Recursively clones an object/array, replacing primitive values with defaults. */
const deepCloneWithDefaults = (template: any): any => {
    if (Array.isArray(template)) {
        return [];
    }
    if (typeof template === 'object' && template !== null) {
        const newObj: { [key: string]: any } = {};
        for (const key in template) {
            newObj[key] = deepCloneWithDefaults(template[key]);
        }
        return newObj;
    }
    return getDefaultValue(typeof template);
};


// --- Form Generation ---

/**
 * Creates the value part of a property (e.g., text input, fieldset for object).
 * @param value - The JSON value.
 * @param path - The dot-notation path to the current element.
 */
const createValueElement = (value: any, path: string): HTMLElement => {
    if (value === null) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = 'null';
        input.disabled = true;
        input.setAttribute('data-type', 'null');
        return input;
    }

    const type = Array.isArray(value) ? 'array' : typeof value;

    switch (type) {
        case 'string': {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.setAttribute('value', value);
            input.setAttribute('data-type', 'string');
            return input;
        }
        case 'number': {
            const input = document.createElement('input');
            input.type = 'number';
            const stringValue = value.toString();
            input.value = stringValue;
            input.setAttribute('value', stringValue);
            input.setAttribute('data-type', 'number');
            return input;
        }
        case 'boolean': {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value;
            input.setAttribute('data-type', 'boolean');
            return input;
        }
        case 'object': {
            const fieldset = document.createElement('fieldset');
            fieldset.setAttribute('data-type', 'object');
            Object.entries(value).forEach(([key, subValue]) => {
                fieldset.appendChild(createPropertyElement(key, subValue, `${path}.${key}`));
            });
            fieldset.appendChild(createAddPropertyControls(fieldset, path));
            return fieldset;
        }
        case 'array': {
            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'array-container';
            arrayContainer.setAttribute('data-type', 'array');
            
            const listContainer = document.createElement('div');
            listContainer.className = 'array-list';
            arrayContainer.appendChild(listContainer);

            value.forEach((item, index) => {
                listContainer.appendChild(createArrayItem(item, index, path));
            });
            
            const addButton = document.createElement('button');
            addButton.textContent = '+';
            addButton.className = 'add-btn';
            addButton.ariaLabel = `Add item to array`;
            addButton.onclick = (e) => {
                e.preventDefault();
                const template = value.length > 0 ? value[0] : "new value";
                const newItemValue = typeof template === 'object' && template !== null
                    ? deepCloneWithDefaults(template)
                    : getDefaultValue(typeof template);
                listContainer.appendChild(createArrayItem(newItemValue, listContainer.children.length, path));
            };
            arrayContainer.appendChild(addButton);
            return arrayContainer;
        }
    }
    // Fallback for other types
    const input = document.createElement('input');
    input.type = 'text';
    input.value = String(value);
    input.disabled = true;
    input.setAttribute('data-type', 'unknown');
    return input;
};

/**
 * Creates an entire property row (key input + value element + remove button).
 * @param key - The JSON key.
 * @param value - The JSON value.
 * @param path - The path to the parent object.
 */
const createPropertyElement = (key: string, value: any, path: string): HTMLElement => {
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'key-input';
    keyInput.value = key;

    const valueContainer = document.createElement('div');
    valueContainer.className = 'property-value';
    valueContainer.appendChild(createValueElement(value, `${path}.${key}`));
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '−';
    removeBtn.className = 'remove-btn';
    removeBtn.ariaLabel = `Remove property ${key}`;
    removeBtn.onclick = (e) => {
        e.preventDefault();
        propertyDiv.remove();
    };

    propertyDiv.appendChild(keyInput);
    propertyDiv.appendChild(valueContainer);
    propertyDiv.appendChild(removeBtn);

    return propertyDiv;
};

/**
 * Creates an element representing an item in an array.
 * @param item - The value of the array item.
 * @param index - The index of the item.
 * @param path - The path to the parent array.
 */
const createArrayItem = (item: any, index: number, path: string): HTMLElement => {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'array-item';
    
    const valueElement = createValueElement(item, `${path}[${index}]`);
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '−';
    removeBtn.className = 'remove-btn';
    removeBtn.ariaLabel = `Remove item ${index + 1}`;
    removeBtn.onclick = (e) => {
        e.preventDefault();
        itemContainer.remove();
    };
    
    const valueWrapper = document.createElement('div');
    valueWrapper.className = 'property-value';
    valueWrapper.appendChild(valueElement);
    
    itemContainer.appendChild(valueWrapper);
    itemContainer.appendChild(removeBtn);
    return itemContainer;
}

/**
 * Creates the controls for adding a new property to an object.
 * @param container - The HTML element (fieldset or main editor) to add the property to.
 * @param path - The path to the current object.
 */
const createAddPropertyControls = (container: HTMLElement, path: string): HTMLElement => {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'add-property-controls';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.placeholder = 'New property name...';
    
    const typeSelect = document.createElement('select');
    ['string', 'number', 'boolean', 'object', 'array'].forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        typeSelect.appendChild(option);
    });

    const addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.ariaLabel = 'Add new property';
    addButton.onclick = (e) => {
        e.preventDefault();
        const newKey = keyInput.value.trim();
        if (!newKey) {
            alert('Property name cannot be empty.');
            return;
        }
        // Check for duplicate keys
        const existingKeys = Array.from(container.querySelectorAll(':scope > .property > .key-input')).map(el => (el as HTMLInputElement).value);
        if (existingKeys.includes(newKey)) {
            alert(`Property "${newKey}" already exists.`);
            return;
        }

        const newType = typeSelect.value;
        const newValue = getDefaultValue(newType);
        const newProperty = createPropertyElement(newKey, newValue, path);
        
        container.insertBefore(newProperty, controlsDiv);
        keyInput.value = '';
        keyInput.focus();
    };

    controlsDiv.appendChild(keyInput);
    controlsDiv.appendChild(typeSelect);
    controlsDiv.appendChild(addButton);
    return controlsDiv;
};

// --- JSON Reconstruction ---

/** Recursively builds a JSON object from a container of property elements. */
const buildObjectFromForm = (container: HTMLElement): any => {
    const obj: { [key: string]: any } = {};
    const properties = container.querySelectorAll(':scope > .property');

    properties.forEach(prop => {
        const keyInput = prop.querySelector('.key-input') as HTMLInputElement;
        const key = keyInput?.value.trim();

        if (!key) return;

        const valueContainer = prop.querySelector('.property-value');
        const valueElement = valueContainer?.children[0] as HTMLElement;

        if (!valueElement) return;

        const type = valueElement.getAttribute('data-type');
        switch (type) {
            case 'string':
                obj[key] = (valueElement as HTMLInputElement).value;
                break;
            case 'number':
                const numVal = parseFloat((valueElement as HTMLInputElement).value);
                obj[key] = isNaN(numVal) ? 0 : numVal;
                break;
            case 'boolean':
                obj[key] = (valueElement as HTMLInputElement).checked;
                break;
            case 'object':
                obj[key] = buildObjectFromForm(valueElement as HTMLElement);
                break;
            case 'array':
                obj[key] = buildArrayFromForm(valueElement as HTMLElement);
                break;
            case 'null':
                obj[key] = null;
                break;
        }
    });
    return obj;
};

/** Builds a JSON array from a container of array item elements. */
const buildArrayFromForm = (container: HTMLElement): any[] => {
    const arr: any[] = [];
    const items = container.querySelectorAll(':scope > .array-list > .array-item');
    
    items.forEach(item => {
        const valueContainer = item.querySelector('.property-value');
        const valueElement = valueContainer?.children[0] as HTMLElement;
        if (!valueElement) return;

        const type = valueElement.getAttribute('data-type');
        let value;
         switch (type) {
            case 'string':
                value = (valueElement as HTMLInputElement).value;
                break;
            case 'number':
                const numVal = parseFloat((valueElement as HTMLInputElement).value);
                value = isNaN(numVal) ? 0 : numVal;
                break;
            case 'boolean':
                value = (valueElement as HTMLInputElement).checked;
                break;
            case 'object':
                value = buildObjectFromForm(valueElement as HTMLElement);
                break;
            case 'array':
                value = buildArrayFromForm(valueElement as HTMLElement);
                break;
            case 'null':
                value = null;
                break;
        }
        arr.push(value);
    });
    return arr;
};

/**
 * Builds a JSON object or array from the visual editor form.
 * Throws an error if the editor is empty or invalid.
 */
const getJsonFromForm = (): any => {
    const firstChild = visualEditor.children[0] as HTMLElement;
    if (!firstChild || firstChild.id === 'visual-editor-placeholder') {
        throw new Error("Visual editor is empty.");
    }

    if (firstChild.classList.contains('array-container')) {
        return buildArrayFromForm(firstChild);
    }
    
    return buildObjectFromForm(visualEditor);
};


// --- Event Handlers ---

/** Handles the "Generate Form" button click. */
generateFormBtn.addEventListener('click', () => {
    inputMessageArea.innerHTML = '';
    visualEditor.innerHTML = '';
    outputControlsArea.innerHTML = '';

    try {
        const json = JSON.parse(jsonInput.value);
        if (visualEditorPlaceholder) visualEditorPlaceholder.style.display = 'none';
        
        const rootType = Array.isArray(json) ? 'array' : typeof json;

        if (rootType === 'object' && json !== null) {
            Object.entries(json).forEach(([key, value]) => {
                visualEditor.appendChild(createPropertyElement(key, value, 'root'));
            });
            visualEditor.appendChild(createAddPropertyControls(visualEditor, 'root'));
        } else if (rootType === 'array') {
            const arrayRoot = createValueElement(json, 'root');
            visualEditor.appendChild(arrayRoot);
        } else {
             throw new Error("Root element must be an object or an array.");
        }

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Validate & Download JSON';
        downloadBtn.onclick = handleDownload;
        outputControlsArea.appendChild(downloadBtn);
        
        if (rootType === 'object' && json !== null) {
            const addSiblingBtn = document.createElement('button');
            addSiblingBtn.textContent = 'Add Top-Level Entry';
            addSiblingBtn.className = 'btn-secondary';
            addSiblingBtn.title = 'Wraps the current object in an array to add more entries.';
            
            addSiblingBtn.onclick = () => {
                try {
                    const currentJson = getJsonFromForm();
                    if (typeof currentJson !== 'object' || currentJson === null || Array.isArray(currentJson)) {
                        showMessage('Can only add siblings to a root object.', 'error');
                        return;
                    }

                    const newSibling = deepCloneWithDefaults(currentJson);
                    const newJsonArray = [currentJson, newSibling];

                    visualEditor.innerHTML = '';
                    outputControlsArea.innerHTML = '';

                    const arrayRoot = createValueElement(newJsonArray, 'root');
                    visualEditor.appendChild(arrayRoot);

                    const newDownloadBtn = document.createElement('button');
                    newDownloadBtn.textContent = 'Validate & Download JSON';
                    newDownloadBtn.onclick = handleDownload;
                    outputControlsArea.appendChild(newDownloadBtn);

                    showMessage('Converted to array. Use the green + button in the visual editor to add more entries.', 'success');

                } catch (error: any) {
                    showMessage(`Could not add entry: ${error.message}`, 'error');
                }
            };
            outputControlsArea.appendChild(addSiblingBtn);
        }

    } catch (error: any) {
        if (visualEditorPlaceholder) visualEditorPlaceholder.style.display = 'block';
        showMessage(`Invalid JSON: ${error.message}`, 'error');
    }
});

/** Handles beautifying the JSON in the input textarea. */
beautifyBtn.addEventListener('click', () => {
    try {
        const uglyJson = jsonInput.value;
        const parsedJson = JSON.parse(uglyJson);
        const prettyJson = JSON.stringify(parsedJson, null, 2);
        jsonInput.value = prettyJson;
        showMessage('JSON successfully formatted!', 'success');
    } catch (error: any) {
        showMessage(`Invalid JSON: ${error.message}`, 'error');
    }
});

/** Handles validating the JSON in the input textarea. */
validateBtn.addEventListener('click', () => {
     try {
        JSON.parse(jsonInput.value);
        showMessage('JSON is valid!', 'success');
    } catch (error: any) {
        showMessage(`Invalid JSON: ${error.message}`, 'error');
    }
});

/** Handles updating the JSON input from the visual editor. */
updateJsonBtn.addEventListener('click', () => {
    try {
        const jsonData = getJsonFromForm();
        const jsonString = JSON.stringify(jsonData, null, 2);
        jsonInput.value = jsonString;
        showMessage('JSON input updated from visual editor.', 'success');
    } catch (error: any) {
        showMessage(`Error generating JSON from form: ${error.message}`, 'error');
    }
});


/** Handles the "Validate & Download" button click. */
const handleDownload = () => {
    try {
        const jsonData = getJsonFromForm();
        const jsonString = JSON.stringify(jsonData, null, 2);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'edited.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('JSON downloaded successfully.', 'success');

    } catch (error: any) {
        showMessage(`Error generating JSON: ${error.message}`, 'error');
    }
};

// Auto-generate form on load with the sample JSON
document.addEventListener('DOMContentLoaded', () => {
    generateFormBtn.click();
});
