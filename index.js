'use strict';

(function() {
  /*global HTMLElement*/
  class JSONSchema extends HTMLElement {
    constructor() {
        // establish prototype chain
        super();
    }

    static get observedAttributes() {
      return ['url'];
    }

    // fires after the element has been attached to the DOM
    connectedCallback() {
      this.update();
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
      if (attrName === 'url') {
        this.update();
      }
    }

    getHTML() {
      const uid = Math.ceil((Math.random() * 10e10).toString())
      this.id = `schema-viewer-${uid}`
      return `
      ${this.getStyle()}
      <div>
        <h2>Field Definitions</h2>
        <p color="#555">The schema fields and definitions are listed below.  The optional fields are marked in red but serve to provide additional, helpful information. You can view a sample JSON file <a href="${this.url}" target="blank">here</a>.</p>
        <div>
          <input type="checkbox" style="text-align: left" onclick="document.getElementById('${this.id}').toggleOptionalFields()">
          <label>Hide optional fields</label>
        </div>
        <table>
          <thead>
            <tr>
              <th class='field-name-column'>Field Name</th>
              <th>Data Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(this.schema.properties).map(entry => {
              const [key, value] = entry;
              const isRequired = this.schema.required.includes(key);
              return this.getSection(entry, isRequired);
            })}
          </tbody>
        </table>
      </div>
      `
    }

    getDescription(obj) {
      if (obj.description) {
        return obj.description
      } else if (obj.array && obj.array.description) {
        return obj.array.description
      } else if (obj.items && obj.items.description) {
        return obj.items.description
      }
    }

    getRequired(obj) {
      if (obj.required) {
        return obj.required
      } else if (obj.array && obj.array.required) {
        return obj.array.required
      } else if (obj.items && obj.items.required) {
        return obj.items.required
      }
    }

    getDropDown(status) {
      if (status === 'collapsed') {
        return `<div class='dropdown' onclick="document.getElementById('${this.id}').toggleDropDown(event)"><div class="arrow-up"></div></div>`
      } else if (status === 'expanded') {
        return `<div class='dropdown' onclick="document.getElementById('${this.id}').toggleDropDown(event)"><div class="arrow-down"></div></div>`
      } else {
        return `<div class="dropdown"></div>`
      }
    }

    getSection([key, value], isRequired=false, indent=0) {
      try {
        const { items, properties, type } = value;
        console.error("value:", value);
        const description = this.getDescription(value);
        const required = this.getRequired(value);
        console.log("required:", required);
        console.log("starting this.getSection with [key, value]:", [key, value]);
        const hasDropDown = type === 'array' || type === 'object'
        console.log("hasDropDown:", hasDropDown)
        let trClasses = []
        if (indent === 0) trClasses.push('first')
        if (isRequired === false) trClasses.push('optional')
        const trClass = trClasses.join(' ')
        const dropDownHTML = hasDropDown ? this.getDropDown('expanded') : this.getDropDown('invisble');
        let html = `<tr class="${trClass}" indent="${indent}">
          <td style="padding-left: ${10+20*indent}px">${dropDownHTML}<div class="field-name-text">${key}</div></td>
          <td class="data-type"><div>${type}</div></td>
          <td><div>${description}</div></td>
        </tr>`
        if (hasDropDown) {
          let entries
          if (type === 'array' && (items.type === 'array' || items.type === 'object')) {
            entries = Object.entries(items.properties);
          } else if (type === 'object') {
            entries = Object.entries(properties);
          }

          if (entries) {
            html += entries.map(entry => {
              const [entryKey, entryValue] = entry;
              console.log("required, entrykey:", [required, entryKey]);
              const itemRequired = Array.isArray(required) && required.includes(entryKey);
              if (itemRequired) console.log(`${entryKey} is required`);
              return this.getSection(entry, itemRequired, indent+1);
            }).join('');
          }
        }
        if (html.includes(',,')) {
          console.log("html:", [html]);
        }
        return html
      } catch (error) {
        console.error("error in getSection:", error);
        throw error;
      }
    }

    getSchema() {
      /* global fetch */
      return fetch(this.url)
        .then(response => response.json())
        .then(schema => {
          this.schema = schema
          return schema
        });
    }

    getStyle() {
      const arrowSize = '8px'
      const { id } = this
      return `
      <style>

        json-schema[hide-optional-fields='true'] tr.optional {
          display: none;
        }

        #${id} > div {
          background: white;
          padding: 15px;
        }

        #${id} input {
          height: 20px;
          width: 20px;
          vertical-align: sub;
        }

        #${id} [class*=arrow] {
          cursor: pointer;
        }

        #${id} .arrow-down {
          width: 0;
          height: 0;
          border-left: ${arrowSize} solid transparent;
          border-right: ${arrowSize} solid transparent;
          border-top: ${arrowSize} solid #000;
        }

        #${id} .arrow-left {
          width: 0;
          height: 0;
          border-top: ${arrowSize} solid transparent;
          border-bottom: ${arrowSize} solid transparent;
          border-right: ${arrowSize} solid #000;
        }

        #${id} th {
          background: #323A45;
          color: white;
          padding: .75rem 2rem;
        }

        #${id} table {
          border-collapse: collapse;
          border-spacing:0;
          width: 100%;
        }

        #${id} td {
          border-bottom: 1px solid lightgray;
          border-left: 1px solid lightgray;
          border-right: 1px solid lightgray;
          padding: 10px;
        }

        #${id} td div, #${id} td span {
        }

        #${id} .field-name-column {
          width: 40%;
        }

        #${id} .dropdown {
          display: inline-block;
          padding-left: .25rem;
          width: 2rem;
        }

        #${id} .data-type {
          text-align: center;
        }

        #${id} .field-name-text {
          display: inline-block;
        }

        #${id} tr.first {
          background: #F0F5FB;
        }

        #${id} tr.optional td {
          color: rgb(153, 0, 51);
        }
      </style>`
    }

    toggleDropDown(event) {
      console.log("starting toggleDropDown with", event);
      const { target } = event;
      const row = event.target.parentElement.parentElement.parentElement;
      console.log("row:", row);
      // iterate down rows setting display none to all until hit one with indent equal or less than current
      const indent = Number(row.getAttribute('indent') || 0);
      let sibling = row;
      while (sibling.nextElementSibling) {
        sibling = sibling.nextElementSibling
        const siblingIndent = Number(sibling.getAttribute('indent') || 0);
        console.log(sibling, "indent is", siblingIndent);
        if (siblingIndent > indent) {
          if (sibling.style.display === 'none') {
            sibling.style.display = null;
          } else {
            sibling.style.display = 'none';
          }
        } else {
          break;
        }
      }
    }

    toggleOptionalFields() {
      console.log("starting toggleOptionalFields");
      const attrName = "hide-optional-fields";
      const currentValue = this.getAttribute(attrName) || 'false';
      console.log("current is", [currentValue]);
      const newValue = currentValue === 'false' ? 'true' : 'false';
      this.setAttribute(attrName, newValue);
    }

    update() {
      const url = this.getAttribute('url')
      if (url !== this.url) {
        this.url = url
        this.getSchema(url).then(schema => {
          console.log("[json-schema] setting html using", schema)
          this.innerHTML = this.getHTML()

          // fix weird bug where commas mysteriously appearing above table
          this.innerHTML = this.innerHTML.replace(/,{3,}/g, '')
        })
      }
    }

  }

  // let the browser know about the custom element
  /*global customElements*/
  customElements.define('json-schema', JSONSchema);
})();