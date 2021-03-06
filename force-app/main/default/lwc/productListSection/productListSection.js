import { LightningElement, track, wire } from 'lwc';
import { getListUi } from 'lightning/uiListApi';
import invokeCachableAction from '@salesforce/apex/ActionControllerTemplate.invokeCachableAction'
import invokeAction from '@salesforce/apex/ActionControllerTemplate.invokeAction';
import CATEGORY_OBJECT from '@salesforce/schema/Category__c';
import PRODUCT_CONFIGURATION_OBJECT from '@salesforce/schema/Product_Configuration__c';

export default class ProductListSection extends LightningElement {
    controllerName = "ProductListController";
    selectedCategoryIds = new Set();

    categoriesStore = new Map();
    selectedFilters = new Map();
    
    @track showFiltersMode = false;
    @track categoriesToShow = [];
    @track configsToShow = [];
    @track selectedProducts = [];

    @track value = "Red";

    @track modalEnabled = false;
    @track productEditMode = false;
    @track productDeleteMode = false;
    @track productCreateMode = false;
    @track selectedProductId;


    @wire (getListUi, {objectApiName: CATEGORY_OBJECT, listViewApiName: "Top_Level"})
    retrievedTopCategories ({data, error}) {
        if (data) {
            let tests = [];

            data.records.records.forEach((currentCategory, index) => {
                let test = this.configurateCategoryWrapper(currentCategory.fields.Id.value, currentCategory.fields.Name.value, 0, false);

                tests.push(test);
            });

            this.categoriesToShow.push({index: this.categoriesToShow.length, data: tests});

            this.hideSpinner();
        }
    }

    @wire (getListUi, {objectApiName: PRODUCT_CONFIGURATION_OBJECT, listViewApiName: "All_Records"})
    retrievedProductConfigs ({data, error}) {
        if (data) {
            console.log("configs");
            console.log(data);
            console.log(data.records.records);

            data.records.records.forEach((currentConfig, index)=>{
                console.log(currentConfig.fields);

                this.configsToShow.push(this.configurateConfigWrapper(index, currentConfig.fields));
            });
        } else {
            //handle error
        }
    }

    connectedCallback() {
        //this.showSpinner();
    }

    filtersMode() {
        this.showFiltersMode = !this.showFiltersMode;
        //console.log(this.topCategories);
    }

    handleCategoryClick(event) {
        var element = event.target;

        let level = element.name;
        let id = element.id.substr(0, 18);
        let value = element.checked;

        console.log("level - " + level);
        console.log("id - " + id);
        console.log("value - " + value);

        if (element.type === 'checkbox-button') {
            if (value) {
                this.selectedCategoryIds.add(id);
            } else {
                this.selectedCategoryIds.delete(id);
            }
        }

        this.categoriesToShow[level].data.forEach((currentCategory, index) =>{
            if (currentCategory.id === id) {
                currentCategory.iconName = "utility:chevronright";
            } else {
                currentCategory.iconName = "utility:down";
            }
        });

        console.log("selcted ids");
        console.log(this.selectedCategoryIds);

        this.categoriesToShow.splice(level+1, this.categoriesToShow.length-1);

        let categoriesRequestAction = JSON.stringify(
            [{className: this.controllerName, action: "get-child-categories", args: {categoryId: id}}]
        );

        invokeCachableAction({actions: categoriesRequestAction}).then(
            (childCategories) => {
                let categoriesWrappers = [];

                childCategories[0].forEach((currentCategory, index)=>{
                    let categoryWrapper = this.configurateCategoryWrapper(currentCategory.Id, currentCategory.Name,
                        level+1, this.selectedCategoryIds.has(currentCategory.Id));

                    categoriesWrappers.push(categoryWrapper);
                });

                if (childCategories) {
                    if (childCategories.length != 0) {
                        this.categoriesToShow.push({index: this.categoriesToShow.length, data: categoriesWrappers});
                    }
                }
            }
        ).catch(error => {
            console.log(JSON.stringify(error));
        });
    }

    retrieveRecords() {
        this.showSpinner();

        console.log(Array.from(this.selectedFilters));

        let filters = [];

        this.selectedFilters.forEach((value, key, map) => {
            let element = [key];
            element = element.concat(value);

            filters.push(element);
        });

        console.log(filters);

        let retrieveProductsAction = JSON.stringify(
            [{className: this.controllerName, action: "retrieve-products",
                args: {
                    categoryIds: JSON.stringify(Array.from(this.selectedCategoryIds)),
                    filters: JSON.stringify(filters)
                }
            }]
        );

        invokeCachableAction({actions: retrieveProductsAction}).then(
            (products) => {
                console.log(products);

                this.selectedProducts = products[0];
                this.hideSpinner();
            }
        ).catch(error => {
            console.log(JSON.stringify(error));
        });
    }

    handleFilterChange(event) {
        console.log(event.target);
        console.log(event.target.name);
        console.log(event.target.value);

        if (event.target.value) {
            console.log(event.target);
            if (!this.selectedFilters.get(event.target.name)) {
                if (event.target.localName == "lightning-combobox") {
                    this.selectedFilters.set(event.target.name, ['Drop Down']);
                } else {
                    this.selectedFilters.set(event.target.name, [event.target.type]);
                }


            }

            if (event.target.placeholder == "FROM") {
                this.selectedFilters.get(event.target.name)[1] = event.target.value;
            } else if (event.target.placeholder == "TO") {
                this.selectedFilters.get(event.target.name)[2] = event.target.value;
            } else {
                this.selectedFilters.get(event.target.name)[1] = event.target.value;
            }
        } else {
            if (event.target.placeholder == "FROM") {
                this.selectedFilters.get(event.target.name)[1] = null;

                if (this.selectedFilters.get(event.target.name)[2] == null) {
                    this.selectedFilters.delete(event.target.name);
                }
            } else if (event.target.placeholder == "TO") {
                this.selectedFilters.get(event.target.name)[2] = null;

                if (this.selectedFilters.get(event.target.name)[1] == null) {
                    this.selectedFilters.delete(event.target.name);
                }
            } else {
                this.selectedFilters.delete(event.target.name);
            }
        }

        console.log(this.selectedFilters);
    }

    editProduct(event) {

    }

    deleteProduct(event) {
        console.log(event.target.id);
    }

    createProduct(event) {

    }

    closeModal() {
        this.productCreateMode = false;
        this.productDeleteMode = false;
        this.productEditMode = false;
        this.selectedProductId = null;
    }

    configurateCategoryWrapper(categoryId, categoryName, level, value) {
        return {level: level, name: categoryName, id: categoryId, value: value, iconName: "utility:down"};
    }

    configurateConfigWrapper(index, configs) {
        let inputType;
        let isSelect;
        let isNumber = false;
        let isText = false;
        let options = false;

        switch(configs.Type__c.value) {
            case "Number":
                inputType = "number";
                isNumber = true;
                break;
            case "Text":
                inputType = "text";
                isText = true;
                break;
            case "Drop Down":
                inputType = "select"
                isSelect = true;
                options = this.parsePicklistValues(configs.Picklist_Values__c.value);
                console.log(options);
                break;
            default:
                inputType = "text";
                isText = true;
        }

        console.log(inputType);
        console.log(isSelect);

        return {
            index: index,
            name: configs.Api_Name__c.value,
            type: configs.Type__c.value,
            isSelect: isSelect,
            isNumber: isNumber,
            isText: isText,
            options: options
        };
    }

    parsePicklistValues (values) {
        let valuesArr = values.split(',');
        let options = [];

        valuesArr.forEach((currentValue, i, arr) => {
            options.push({ label: currentValue, value: currentValue });
        });

        return options;
    }

    showSpinner () {
        this.dispatchEvent(new CustomEvent('showspinner'));
    }

    hideSpinner() {
        this.dispatchEvent(new CustomEvent('hidespinner'));
    }
}