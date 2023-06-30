/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | Autor      |  DD/MM/YY  | Cod_desarrollo - Descripción desarrollo                             |
     |---------+------------+------------+---------------------------------------------------------------------+
     |   Descripción modificación                                .                                             |
     +---------+------------+------------+---------------------------------------------------------------------+
*/

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

 define(['N/url', 'N/record'],
    function(n_url, n_record){
        
        function pageInit(context){
            return true;
        }
        
        function saveRecord(context){
            return true;
        }
        
        function validateField(context){
            return true;
        }
        
        function fieldChanged(context){    
            return true;        
            
        }
        
        function postSourcing(context){
            return true;
        }
        
        function lineInit(context){
            return true;
        }
        
        function validateLine(context){
            return true;
        }
        
        function validateInsert(context){
            return true;
        }
        
        function validateDelete(context){
            return true;
        }

        function sublistChanged(context){
            return true;
        }

        function getNombre(){
            var nombre = document.getElementById('firstname').value;  
            return nombre;
        }

        function getApellido(){
            var apellido = document.getElementById('lastname').value; 
            return apellido;
        }

        function getEmail(){
            var email = document.getElementById('email').value; 
            return email;
        }
        
        function obtenerInfo(){
            var n = getNombre();
            console.log(n);
            var a = getApellido();
            console.log(a);
            var e = getEmail();
            console.log(e);
            document.getElementById('submitter').click();

        }
        
        return{
            pageInit: pageInit,
            saveRecord: saveRecord,
            validateField: validateField,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            lineInit: lineInit,
            validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete,
            sublistChanged: sublistChanged,
            obtenerInfo: obtenerInfo
        };
    }
);