/* global customElements */
/* global HTMLElement */

(function() {
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
      this.id = `schema-viewer-${this.getUID()}`;
      return `
      ${this.getStyle()}
      <div>
        <h2>Field Definitions</h2>
        <p color="#555">The schema fields and definitions are listed below.  The optional fields are marked in red but serve to provide additional, helpful information. You can view a sample JSON file <a href="${this.url}" target="blank">here</a>.</p>
        <div style="margin-bottom: 10px">
          <input id="json-schema-hide-optional-fields" type="checkbox" style="cursor: pointer; text-align: left" onclick="document.getElementById('${this.id}').toggleOptionalFields()">
          <label for="json-schema-hide-optional-fields" style="cursor: pointer">Hide optional fields</label>
        </div>
        <div class="desktop-and-mobile-views">
          ${this.getDetails()}
          <table>
            <thead>
              <tr>
                <th class='field-name-column'>Field Name</th>
                <th class='data-type-column'>Data Type</th>
                <th class='description-column'>Description</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(this.schema.properties).map(entry => {
                const [key, value] = entry;
                const isRequired = this.schema.required.includes(key);
                return this.getSection(entry, isRequired, 0);
              })}
            </tbody>
          </table>
        </div>
      </div>
      `;
    }

    updateDetails() {
      this.querySelector("#mobile-details").outerHTML = this.getDetails();
    }

    getDetails() {
      return `
        <div id="mobile-details-overlay"></div>
        <div id="mobile-details">
          <div id="mobile-details-title">${this.selectedMobileDetailsTitle}</div>
          <table>
            <thead>
              <tr>
                <th id='mobile-data-type-column'>Data Type</th>
                <th class='mobile-description-column'>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: ${this.selectedBackgroundColor}">
                <td class="mobile-data-type">${this.selectedDataType}</td>
                <td class="mobile-description">${this.selectedDescription}</td>
              </tr>
              <tr>
                <td class="back" onclick="document.getElementById('${this.id}').hideDetails()">
                  <div id="back-arrow" class="arrow-left"></div>
                  <div class="field-name-text">back</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    getDescription(obj) {
      if (obj.description) {
        return obj.description;
      } else if (obj.array && obj.array.description) {
        return obj.array.description;
      } else if (obj.items && obj.items.description) {
        return obj.items.description;
      } else {
        return '';
      }
    }

    getRequired(obj) {
      if (obj.required) {
        return obj.required;
      } else if (obj.array && obj.array.required) {
        return obj.array.required;
      } else if (obj.items && obj.items.required) {
        return obj.items.required;
      }
    }

    getDropDown(status) {
      if (status === 'collapsed') {
        return `<div class='dropdown' status=${status} onclick="document.getElementById('${this.id}').toggleDropDown(event)"><div class="arrow-up-or-down"></div></div>`;
      } else if (status === 'expanded') {
        return `<div class='dropdown' status=${status} onclick="document.getElementById('${this.id}').toggleDropDown(event)"><div class="arrow-up-or-down"></div></div>`;
      } else {
        return `<div class="dropdown"></div>`;
      }
    }

    getUID() {
      return Math.ceil((Math.random() * 10e10).toString());
    }

    hideDetails() {
      this.setAttribute("details", "false");
    }

    showDetails(rowID) {
      const row = document.getElementById(rowID);
      this.setAttribute("details", "true");
      this.selectedDataType = row.querySelector(".data-type").textContent.trim();
      this.selectedMobileDetailsTitle = row.querySelector('.field-name-text').textContent.trim();
      this.selectedDescription = this.prettify(row.querySelector(".description").textContent.trim());
      this.selectedBackgroundColor = window.getComputedStyle(row).backgroundColor;
      this.updateDetails();
    }

    getSection(entry, isRequired, indent) {
      try {
        const [key, value] = entry;
        const { items, properties, type } = value;
        const description = this.prettify(this.getDescription(value));
        const required = this.getRequired(value);
        const hasDropDown = this.hasDropDown(value);
        let trClasses = [];
        if (indent === 0) trClasses.push('first');
        if (isRequired === false) trClasses.push('optional');
        const trClass = trClasses.join(' ');
        const dropDownHTML = hasDropDown ? this.getDropDown('expanded') : this.getDropDown('invisble');
        const rowID = this.getUID();
        let html = `<tr id="${rowID}" class="${trClass}" indent="${indent}">
          <td style="padding-left: ${10+20*indent}px">
            ${dropDownHTML}
            <div class="field-name-text">${key}</div>
            <div class="details" onclick="document.getElementById('${this.id}').showDetails('${rowID}')">
              <div class="details-text">details</div>
              <div class="details-arrow arrow-right"></div>
            </div>
          </td>
          <td class="data-type">
            <div>${(Array.isArray(type) ? type.join(' or ') : type)}</div>
          </td>
          <td class="description">
            <div>${description}</div>
          </td>
        </tr>`;
        if (hasDropDown) {
          let entries;
          if (type.includes('array') && (items.type.includes('array') || items.type.includes('object'))) {
            entries = Object.entries(items.properties);
          } else if (type.includes('object')) {
            entries = Object.entries(properties);
          }

          if (entries) {
            html += entries.map(entry => {
              const [entryKey, entryValue] = entry;
              const itemRequired = Array.isArray(required) && required.includes(entryKey);
              return this.getSection(entry, itemRequired, indent+1);
            }).join('');
          }
        }
        return html;
      } catch (error) {
        console.error("error in getSection:", error);
        throw error;
      }
    }

    getJSON(url) {
      return new Promise(resolve => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            resolve(JSON.parse(xhr.response));
          }
        }
        xhr.open('GET', url, true);
        xhr.send('');
      })
    }

    getSchema() {
      return this.getJSON(this.url)
        .then(schema => {
          this.schema = schema;
          return schema;
        });
    }

    getStyle() {
      const arrowSize = '8px';
      const borderColor = 'lightgray';
      const { id } = this;
      return `
      <style>
        json-schema[hide-optional-fields='true'] tr.optional {
          display: none;
        }

        #${id} > div {
          background: white;
          padding: 15px;
          position: relative;
        }

        #${id} .desktop-and-mobile-views {
          position: relative;
        }

        #${id} input {
          height: 20px;
          width: 20px;
          vertical-align: sub;
        }

        #${id} [class*=arrow-] {
          cursor: pointer;
          height: 0;
          width: 0;
        }

        #${id} .arrow-up {
          border-left: ${arrowSize} solid transparent;
          border-right: ${arrowSize} solid transparent;
          border-top: ${arrowSize} solid #000;
        }

        #${id} .arrow-down {
          border-left: ${arrowSize} solid transparent;
          border-right: ${arrowSize} solid transparent;
          border-top: ${arrowSize} solid #000;
        }

        #${id} .arrow-left {
          border-top: ${arrowSize} solid transparent;
          border-bottom: ${arrowSize} solid transparent;
          border-right: ${arrowSize} solid #000;
        }

        #${id} .arrow-right {
          border-top: ${arrowSize} solid transparent;
          border-bottom: ${arrowSize} solid transparent;
          border-left: ${arrowSize} solid #000;
        }

        #${id} th {
          background: #323A45;
          border-bottom: 1px solid ${borderColor};
          border-left: 1px solid ${borderColor};
          border-right: 1px solid ${borderColor};
          box-sizing: border-box;
          color: white;
          padding: .75rem 2rem;
        }

        @media screen and (max-width: 500px) {
          #${id} th {
            font-size: 1.1em;
            padding: .75rem .2rem;
          }
        }

        #${id} table {
          border-collapse: collapse;
          border-spacing:0;
          width: 100%;
        }

        #${id} td {
          border-bottom: 1px solid ${borderColor};
          border-left: 1px solid ${borderColor};
          border-right: 1px solid ${borderColor};
          box-sizing: border-box;
          padding: 10px;
        }

        @media screen and (max-width: 500px) {
          #${id} td {
            padding: 5px;
          }
        }

        #${id} td div, #${id} td span {
        }

        #${id} .field-name-column {
          width: 35%;
        }

        #${id} .data-type-column {
          width: 15%;
        }

        #${id} .dropdown {
          display: inline-block;
          padding-left: .25rem;
          width: 30px;
        }

        #${id} .dropdown[status=expanded] > div {
          border-left: ${arrowSize} solid transparent;
          border-right: ${arrowSize} solid transparent;
          border-top: ${arrowSize} solid black;
        }

        #${id} .dropdown[status=collapsed] > div {
          border-bottom: ${arrowSize} solid black;
          border-left: ${arrowSize} solid transparent;
          border-right: ${arrowSize} solid transparent;
        }

        #${id} .data-type, #${id} .mobile-data-type {
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

        #${id} .details {
          display: none;
        }

        #${id} #mobile-details {
          display: none;
        }

        /* mobile view */
        @media screen and (max-width: 600px) {
          #${id} th.data-type-column,
          #${id} th.description-column,
          #${id} td.data-type,
          #${id} td.description
          {
            display: none;
          }

          #${id} .details {
            color: black;
            cursor: pointer;
            display: inline-block;
            float: right;
          }

          #${id} .details-text {
            display: inline-block;
            margin-right: 5px;
          }

          #${id} .details-arrow, #${id} #back-arrow {
            display: inline-block;
            vertical-align: top;
          }

          #${id} #back-arrow {
            margin-right: 5px;
          }

          #${id} #mobile-details {
            background: white;
            bottom: 0;
            left: 0;
            overflow: scroll;
            opacity: 0;
            padding: 15px;
            position: fixed;
            transition: 2s;
            right: 0;
            top: 0;
            z-index: -10;
          }

          #${id} #mobile-details-title {
            font-weight: bold;
            font-size: 1.75em;
            margin-bottom: 15px;
            overflow: hidden;
            text-align: center;
            text-overflow: ellipsis;
          }

          #${id}:not([details=true]) #mobile-details {
            display: none;
            opacity: 0;
          }

          #${id}[details=true] #mobile-details {
            display: block;
            opacity: 1;
            z-index: 11;
          }

          #${id} .dropdown {
            padding-left: .15rem;
            width: 20px;
          }
        }

        #${id} td.back {
          border: none;
          cursor: pointer;
          padding-bottom: 15px;
          padding-top: 15px;
          text-align: center;
        }

        #${id} td.back > div {
          display: inline-block;
        }

        #${id} td.back:hover {
          background: #323A45;
          color: white;
        }

        #${id} td.back:hover .arrow-left {
          border-right-color: white;
        }

        #mobile-data-type-column {
          min-width: 75px;
        }
      </style>`
    }

    hasDropDown(item) {
      const { type } = item;
      return (type.includes('array') && item.items.type !== 'string') || type.includes('object');
    }

    toggleDropDown(event) {
      const { target } = event;
      const row = event.target.parentElement.parentElement.parentElement;

      const dropdownDiv = target.parentElement;
      const status = dropdownDiv.getAttribute('status');
      if (status === 'collapsed') dropdownDiv.setAttribute('status','expanded');
      else if (status === 'expanded') dropdownDiv.setAttribute('status','collapsed');

      // iterate down rows setting display none to all until hit one with indent equal or less than current
      const indent = Number(row.getAttribute('indent') || 0);
      let sibling = row;
      while (sibling.nextElementSibling) {
        sibling = sibling.nextElementSibling;
        const siblingIndent = Number(sibling.getAttribute('indent') || 0);
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
      const attrName = "hide-optional-fields";
      const currentValue = this.getAttribute(attrName) || 'false';
      const newValue = currentValue === 'false' ? 'true' : 'false';
      this.setAttribute(attrName, newValue);
    }

    update() {
      const url = this.getAttribute('url');
      if (url !== this.url) {
        this.url = url;
        this.getSchema(url).then(schema => {
          this.innerHTML = this.getHTML();

          // fix weird bug where commas mysteriously appearing above table
          this.innerHTML = this.innerHTML.replace(/,{3,}/g, '');
        })
      }
    }

    prettify(text) {
      text = this.urlify(text)

      // convert (1) cost: to \n\t(1) <b>cost</b>:
      const bulletRegex = /\(\d{1,2}\) [A-Za-z]{1,25}:/g;
      return text.replace(bulletRegex, match => {
        return "<br/>" + match.replace(/[A-Za-z]{1,25}/, name => `<b>${name}</b>`);
      });
    }

    // https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
    urlify(text) {
      const urlRegex = /(https?:\/\/[^\s']+)/g;
      return text.replace(urlRegex, url => {
        return `<a href="${url}" target="_blank">${url}</a>`;
      });
    }

  }

  customElements.define('json-schema', JSONSchema);
})();
