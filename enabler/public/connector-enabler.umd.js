(function(){"use strict";try{if(typeof document<"u"){var o=document.createElement("style");o.appendChild(document.createTextNode("._modal_1w3g8_1{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,sans-serif}._modalBackdrop_1w3g8_11{position:fixed;top:0;left:0;width:100%;height:100%;background-color:#00000080;z-index:10000}._modalContent_1w3g8_21{position:fixed;background:#fff;z-index:10001;box-shadow:0 4px 24px #00000026}@media (min-width: 769px){._modalContent_1w3g8_21{top:50%;left:50%;transform:translate(-50%,-50%);border-radius:8px;width:90%;max-width:480px;max-height:90vh;overflow-y:auto}}@media (max-width: 768px){._modalContent_1w3g8_21{top:0;right:0;height:100%;width:100%;max-width:400px;border-radius:0;animation:_slideInRight_1w3g8_1 .3s ease-out}}@keyframes _slideInRight_1w3g8_1{0%{transform:translate(100%)}to{transform:translate(0)}}._modalHeader_1w3g8_59{display:flex;align-items:center;justify-content:space-between;padding:24px 24px 20px;border-bottom:1px solid #e0e0e0}._modalTitle_1w3g8_67{font-size:20px;font-weight:600;color:#000;margin:0}._closeButton_1w3g8_74{background:none;border:none;font-size:32px;line-height:1;color:#666;cursor:pointer;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:color .2s ease}._closeButton_1w3g8_74:hover{color:#000}._closeButton_1w3g8_74:focus{outline:none}._modalBody_1w3g8_96{padding:24px}._inputGroup_1w3g8_100{margin-bottom:20px}._inputGroup_1w3g8_100:last-child{margin-bottom:0}._inputLabel_1w3g8_107{display:block;font-size:14px;font-weight:400;color:#333;margin-bottom:8px}._input_1w3g8_100{width:100%;padding:12px 16px;font-size:16px;border:1px solid #d0d0d0;border-radius:4px;transition:border-color .2s ease,box-shadow .2s ease;box-sizing:border-box;background:#fff}._input_1w3g8_100:focus{outline:none;border-color:#2f5233;box-shadow:0 0 0 3px #2f52331a}._input_1w3g8_100::placeholder{color:#999}._errorField_1w3g8_134{color:#d32f2f;font-size:13px;margin-top:6px;min-height:18px;display:none}._errorField_1w3g8_134:not(:empty){display:block}._inputGroup_1w3g8_100:has(._errorField_1w3g8_134:not(:empty)) ._input_1w3g8_100{border-color:#d32f2f}._inputGroup_1w3g8_100:has(._errorField_1w3g8_134:not(:empty)) ._input_1w3g8_100:focus{box-shadow:0 0 0 3px #d32f2f1a}._modalFooter_1w3g8_152{padding:20px 24px 24px;display:flex;flex-direction:column;gap:12px}._addButton_1w3g8_159{width:100%;padding:14px 24px;font-size:16px;font-weight:600;color:#fff;background-color:#2f5233;border:none;border-radius:4px;cursor:pointer;transition:background-color .2s ease}._addButton_1w3g8_159:hover:not(:disabled){background-color:#234019}._addButton_1w3g8_159:active:not(:disabled){background-color:#1a2f13}._addButton_1w3g8_159:disabled{background-color:#ccc;cursor:not-allowed;opacity:.6}._addButton_1w3g8_159:focus{outline:none;box-shadow:0 0 0 3px #2f523333}._cancelButton_1w3g8_187{width:100%;padding:12px 24px;font-size:16px;font-weight:400;color:#666;background:none;border:none;cursor:pointer;transition:color .2s ease}._cancelButton_1w3g8_187:hover{color:#000}._cancelButton_1w3g8_187:focus{outline:none;text-decoration:underline}@media (max-width: 768px){._modalHeader_1w3g8_59{padding:20px 20px 16px}._modalBody_1w3g8_96{padding:20px}._modalFooter_1w3g8_152{padding:16px 20px 20px}._modalTitle_1w3g8_67{font-size:18px}}._wrapper_1w3g8_220{width:100%}._hidden_1w3g8_224{display:none!important}")),document.head.appendChild(o)}}catch(t){console.error("vite-plugin-css-injected-by-js",t)}})();
(function(c,p){typeof exports=="object"&&typeof module<"u"?p(exports):typeof define=="function"&&define.amd?define(["exports"],p):(c=typeof globalThis<"u"?globalThis:c||self,p(c.Connector={}))})(this,function(c){"use strict";class p{baseOptions;constructor(t){this.baseOptions=t}}class C{giftcardOptions;baseOptions;constructor(t){this.giftcardOptions=t.giftcardOptions,this.baseOptions=t.baseOptions}}const o={modal:"_modal_1w3g8_1",modalBackdrop:"_modalBackdrop_1w3g8_11",modalContent:"_modalContent_1w3g8_21",modalHeader:"_modalHeader_1w3g8_59",modalTitle:"_modalTitle_1w3g8_67",closeButton:"_closeButton_1w3g8_74",modalBody:"_modalBody_1w3g8_96",inputGroup:"_inputGroup_1w3g8_100",inputLabel:"_inputLabel_1w3g8_107",input:"_input_1w3g8_100",errorField:"_errorField_1w3g8_134",modalFooter:"_modalFooter_1w3g8_152",addButton:"_addButton_1w3g8_159",cancelButton:"_cancelButton_1w3g8_187",hidden:"_hidden_1w3g8_224"},l=r=>document.querySelector(`#${r}`),i=(r,t)=>{const e=l(r);e.parentElement.classList.add(o.error);const a=e.parentElement.querySelector(`#${r} + .${o.errorField}`);a.textContent=t,a.classList.remove(o.hidden)},y=r=>{const t=l(r);t.parentElement.classList.remove(o.error);const e=t.parentElement.querySelector(`#${r} + .${o.errorField}`);e.textContent="",e.classList.add(o.hidden)},n={checkbox:"giftcard-checkbox",code:"giftcard-code",pin:"giftcard-pin",amount:"giftcard-amount"},w=r=>r.status.state!=="Valid"?r.status.errors?.[0].code||"GenericError":null,g=r=>r.split("-")[0],m="en";class E{translations;constructor(t){this.translations=t}translate(t,e){const a=g(e||m);return this.translations[a]||console.info(`Language '${e}' not supported`),this.translations[a]?.[t]||this.translations[m]?.[t]||t}keyExists(t,e){const a=g(e||m);return!!this.translations[a]?.[t]||!!this.translations[m]?.[t]}}const _={en:{giftCardPlaceholder:"Enter and apply gift card number",giftCardPinPlaceholder:"Enter gift card PIN",errorNotFound:"The gift card number you entered is invalid. Please try again.",errorExpired:"The gift card you entered has expired.",errorCurrencyNotMatch:"The currency of the gift card does not match the currency of the cart.",errorGenericError:"We cannot process your gift card at the moment. Please try again.",errorZeroBalance:"The gift card you entered has no balance.",errorMissingSecurityCode:"Please enter the gift card PIN.",errorInvalidCardNumber:"Gift card number must be numeric and more than 12 characters.",errorInvalidPIN:"PIN must be numeric.",errorInvalidCardOrPin:"Invalid gift card number or PIN. Please try again.",errorUnauthorized:"Unable to verify gift card. Please contact support."},de:{giftCardPlaceholder:"Geschenkkartennummer eingeben und anwenden"},fr:{giftCardPlaceholder:"Saisissez et appliquez le numéro de carte cadeau"},nl:{giftCardPlaceholder:"Voer het cadeaukaartnummer in en pas het toe"},cz:{giftCardPlaceholder:"Zadejte a použijte číslo dárkové karty"},sk:{giftCardPlaceholder:"Zadajte a použite číslo darčekovej karty"},ro:{giftCardPlaceholder:"Introduceți și activați numărul cardului cadou"}};class B extends p{constructor(t){super(t)}build(t){return new v({giftcardOptions:t,baseOptions:this.baseOptions})}}class v extends C{i18n;isSubmitting=!1;constructor(t){super(t),this.i18n=new E(_),this.balance=this.balance.bind(this),this.submit=this.submit.bind(this),this.handleAddGiftCard=this.handleAddGiftCard.bind(this),this.handleClose=this.handleClose.bind(this),this.handleCancel=this.handleCancel.bind(this)}handleClose(){const t=document.getElementById("giftcard-modal");t&&t.remove()}handleCancel(){this.handleClose()}async handleAddGiftCard(){if(!this.isSubmitting)try{this.isSubmitting=!0;const t=document.getElementById("add-giftcard-button");t&&(t.disabled=!0,t.textContent="Processing...");const e=await this.balance();e&&e.status.state==="Valid"&&e.amount&&(await this.submit({amount:e.amount}),this.handleClose())}catch(t){console.error("Error adding gift card:",t)}finally{this.isSubmitting=!1;const t=document.getElementById("add-giftcard-button");t&&(t.disabled=!1,t.textContent="Add Gift Card")}}async balance(){try{const t=l(n.code).value.replace(/\s/g,""),e=l(n.pin).value.replace(/\s/g,"");if(!t)throw i(n.code,this.i18n.translate("errorGenericError",this.baseOptions.locale)),new Error("Card number is required");if(!/^\d+$/.test(t))throw i(n.code,this.i18n.translate("errorInvalidCardNumber",this.baseOptions.locale)),new Error("Card number must be numeric");if(t.length<=12)throw i(n.code,this.i18n.translate("errorInvalidCardNumber",this.baseOptions.locale)),new Error("Card number must be more than 12 characters");if(!e)throw i(n.pin,this.i18n.translate("errorMissingSecurityCode",this.baseOptions.locale)),new Error("PIN is required");if(!/^\d+$/.test(e))throw i(n.pin,this.i18n.translate("errorInvalidPIN",this.baseOptions.locale)),new Error("PIN must be numeric");const a={code:t,securityCode:e},u=this.baseOptions.processorUrl.endsWith("/")?`${this.baseOptions.processorUrl}balance`:`${this.baseOptions.processorUrl}/balance`,s=await(await fetch(u,{method:"POST",headers:{"Content-Type":"application/json","X-Session-Id":this.baseOptions.sessionId},body:JSON.stringify(a)})).json();if(!s?.status?.state)throw s;const d=w(s);if(d){const f=this.i18n.keyExists(`error${d}`,this.baseOptions.locale)?this.i18n.translate(`error${d}`,this.baseOptions.locale):this.i18n.translate("errorGenericError",this.baseOptions.locale);i(n.code,f)}else y(n.code);return s}catch(t){throw i(n.code,this.i18n.translate("errorGenericError",this.baseOptions.locale)),this.baseOptions.onError(t),t}}async submit(t){try{const e=l(n.code).value.replace(/\s/g,""),a=l(n.pin).value.replace(/\s/g,""),u={amount:t.amount,code:e,securityCode:a},h=this.baseOptions.processorUrl.endsWith("/")?`${this.baseOptions.processorUrl}redeem`:`${this.baseOptions.processorUrl}/redeem`,s=await fetch(h,{method:"POST",headers:{"Content-Type":"application/json","X-Session-Id":this.baseOptions.sessionId},body:JSON.stringify(u)}),d=await s.json();if(!s.ok)throw d;const f={isSuccess:d.isSuccess,paymentReference:d.paymentReference};this.baseOptions.onComplete(f)}catch(e){throw this.baseOptions.onError(e),e}}mount(t){document.querySelector(t).insertAdjacentHTML("afterbegin",this._getField());const e=document.getElementById("giftcard-close-button"),a=document.getElementById("giftcard-cancel-button"),u=document.getElementById("add-giftcard-button"),h=document.getElementById("giftcard-modal-backdrop");e&&e.addEventListener("click",this.handleClose),a&&a.addEventListener("click",this.handleCancel),u&&u.addEventListener("click",this.handleAddGiftCard),h&&h.addEventListener("click",s=>{s.target===h&&this.handleClose()}),this.giftcardOptions?.onGiftCardReady?.().then().catch(s=>{throw this.baseOptions.onError(s),s})}_getField(){return`
      <div id="giftcard-modal" class="${o.modal}">
        <div id="giftcard-modal-backdrop" class="${o.modalBackdrop}"></div>
        <div class="${o.modalContent}">
          <div class="${o.modalHeader}">
            <h2 class="${o.modalTitle}">Add a Gift Card</h2>
            <button
              type="button"
              id="giftcard-close-button"
              class="${o.closeButton}"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div class="${o.modalBody}">
            <div class="${o.inputGroup}">
              <label for="${n.code}" class="${o.inputLabel}">
                Gift card code
              </label>
              <input
                type="text"
                id="${n.code}"
                class="${o.input}"
                placeholder=""
                autocomplete="off"
              />
              <div id="giftcard-code-error" class="${o.errorField}" role="alert"></div>
            </div>

            <div class="${o.inputGroup}">
              <label for="${n.pin}" class="${o.inputLabel}">
                Pin Number
              </label>
              <input
                type="text"
                id="${n.pin}"
                class="${o.input}"
                placeholder=""
                autocomplete="off"
              />
              <div id="giftcard-pin-error" class="${o.errorField}" role="alert"></div>
            </div>
          </div>

          <div class="${o.modalFooter}">
            <button
              type="button"
              id="add-giftcard-button"
              class="${o.addButton}"
            >
              Add Gift Card
            </button>
            <button
              type="button"
              id="giftcard-cancel-button"
              class="${o.cancelButton}"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    `}}class b{setupData;constructor(t){this.setupData=b._Setup(t)}static onError=t=>{throw console.log(t),new Error("something went wrong.")};static onComplete=t=>{console.log("onSubmit",t)};static _Setup=async t=>({baseOptions:{sessionId:t.sessionId,processorUrl:t.processorUrl,locale:t.locale,onComplete:t.onComplete?t.onComplete:this.onComplete,onError:t.onError?t.onError:this.onError}});async createGiftCardBuilder(){const t=await this.setupData;if(!t)throw new Error("MockEnabler not initialized");return new B(t.baseOptions)}}c.Enabler=b,Object.defineProperty(c,Symbol.toStringTag,{value:"Module"})});
