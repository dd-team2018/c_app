public class Utils
{
    public static final Integer APOSTROPHE_CHAR_NUMBER = 39;
    
    public enum ActionType
    {
        USER_LOGIN, CHECK_PASSWORD, GET_USERS_LIST, DELETE_USER, GET_CATEGORIES_LIST, DELETE_CATEGORY, GET_PRODUCT_CONFIGS_LIST,
        DELETE_PRODUCT_CONFIG, GET_CHILD_CATEGORIES, RECIEVE_PRODUCTS
    }
    
    public static Map<String, ActionType> actionMapping {
        public get
        {
            if (actionMapping == null)
            {
                actionMapping = new Map<String, ActionType>
                {
                    'user-login' => ActionType.USER_LOGIN,
                    'check-password' => ActionType.CHECK_PASSWORD,
                    'get-users-list' => ActionType.GET_USERS_LIST,
                    'delete-user' => ActionType.DELETE_USER,
                    'get-categories-list' => ActionType.GET_CATEGORIES_LIST,
                    'delete-category' => ActionType.DELETE_CATEGORY,
                    'get-product-configs-list' => ActionType.GET_PRODUCT_CONFIGS_LIST,
                    'delete-product-config' => ActionType.DELETE_PRODUCT_CONFIG,
                    'get-child-categories' => ActionType.GET_CHILD_CATEGORIES,
                    'retrieve-products' => ActionType.RECIEVE_PRODUCTS
                };
            }
            
            return actionMapping;
        }
        private set;
    }
    
    public static ActionType getActionType(String actionName)
    {
        ActionType actionType = actionMapping.get(actionName);
        
        if (actionType == null)
        {
            throw new ActionDoesNotSupportedException();
        }
        
        return actionType;
    }
    
    public static Map<String, SObject> genereteMap(List<SObject> records, String keyFieldName, String sobjectTypeName, String namespace)
    {
        Map<String, SObject> result;
        
        if (namespace != null)
        {
            sobjectTypeName = 'Map<String,' + Type.forName(namespace, sobjectTypeName) + '>';
        }
        else
        {
            sobjectTypeName = 'Map<String,' + Type.forName(sobjectTypeName) + '>';
        }
        
        if (sobjectTypeName != null)
        {
            result  = (Map<String, SObject>)Type.forName(sobjectTypeName).newInstance();
            
            for (SObject currentRcord : records)
            {
                result.put(String.valueOf(currentRcord.get(keyFieldName)), currentRcord);
            }
        }
        else
        {
            result = null;
        }
        
        return result;
    }

     /**
     * @genereteMap: To generate map and store records by custom key.
     * @param: records list of target records
     * @param: keyFieldNames a list of keysets - field names
     * @param: sobjectTypeName name of target sobject
     * @param: namespace name of object namespace
     * @returnType: Map<String, SObject>
     */
    public static Map<String, SObject> genereteMap(List<SObject> records, List<List<String>> keyFieldNames, String sobjectTypeName, String namespace)
    {
        Map<String, SObject> result;

        if (namespace != null)
        {
            sobjectTypeName = 'Map<String,' + Type.forName(namespace, sobjectTypeName) + '>';
        }
        else
        {
            sobjectTypeName = 'Map<String,' + Type.forName(sobjectTypeName) + '>';
        }

        if (sobjectTypeName != null)
        {
            result = (Map<String, SObject>) Type.forName(sobjectTypeName).newInstance();

            for (SObject currentRecord : records)
            {
                for (List<String> currentFieldSet : keyFieldNames)
                {
                    result.put(generateRecordKey(currentFieldSet, currentRecord), currentRecord);
                }
            }
        }
        else
        {
            result = null;
        }

        return result;
    }

     /**
     * @generateRecordKey: To generate unique key for record based on field values
     * @params: fieldKeys
     * @params: record
     * @returnType: String
     */
    public static String generateRecordKey(List<String> fieldKeys, SObject record)
    {
        String result = '';

        for (String currentKeyField : fieldKeys)
        {
            result += 'KeyField:' + record.get(currentKeyField) + ';';
        }

        return result;
    }

	 /**
     * @logException: To log exception
     * @params: ex
     * @returnType:
     */
    public static void logException(Exception ex)
    {
        System.debug('Exception log.');
        System.debug('Exception message: ' + ex.getMessage());
        System.debug('Exception stack trace: ' + ex.getStackTraceString());
    }

    @future
    public static void notifyUsers()
    {

    }
    
    public class ActionDoesNotSupportedException extends Exception {}
}
