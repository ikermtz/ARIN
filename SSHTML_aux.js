/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  2.x    | Iker       |  23/06/23  | Pruebas html con suitelet script                                    |
     |---------+------------+------------+---------------------------------------------------------------------+
*/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/search', 'N/ui/serverWidget', 'N/record', 'N/format','N/log', 'N/xml'],
    function (n_search, serverWidget, n_record, n_format, n_log, n_xml) {
        
        function onRequest(context) {
            
            n_log.debug({title: 'Inicio onRequest'});
            if (context.request.method == 'GET') {
                
                // Pantalla de inicio
                var form = crearPantallaInicio(context);
                context.response.writePage(form);

            } else if (context.request.method == 'POST' && context.request.parameters.submitter == 'Enviar') { 
                
                n_log.debug({title: 'Consultar parametros'});
                var nombre = context.request.parameters.firstname;
                var apellido = context.request.parameters.lastname;
                var email = context.request.parameters.email;
                n_log.debug({title: 'Nombre', details: nombre});
                n_log.debug({title: 'Apellido', details: apellido});
                n_log.debug({title: 'Email', details: email});

                crearRegistro(nombre, apellido, email);
                n_log.debug({title: "Registro creado"});

                // Pantalla de inicio
                var form = crearPantallaInicio(context);
                context.response.writePage(form);
            } 

            n_log.debug({ title: 'Fin onRequest' });
        }

        function crearPantallaInicio(context) {

            var form = serverWidget.createForm({
                title: 'Integrar HTML en Suitelet script'
            });

            // Client Event para obtener acciones
            form.clientScriptFileId = getFileId('SSHTML_cs.js');

            var htmlBody='';
            htmlBody += '<html><head>';
            htmlBody += '<link href="' + n_xml.escape("https://2284927.app.netsuite.com/core/media/media.nl?id=4588&c=2284927&h=A8tyKPZZ8fYnm0h4l-ENjSZH_jSIgcT8qnFWOiJ90kDF8OgL&_xt=.css") + '" type="text/css" rel="stylesheet">';
            htmlBody += '</head>';
            htmlBody += '<body>';
            htmlBody += '<h1> Formulario de registro </h1><table class="center"><tbody><tr>';
            htmlBody += '<td>First Name</td><td class="col-md-8"><input class="form-control" id="firstname" placeholder="First Name" name="firstname" required="" type="text"></td>';
            htmlBody += '</tr><tr>';
            htmlBody += '<td>Last Name</td><td class="col-md-8"><input class="form-control" id="lastname" placeholder="Last Name" name="lastname" required="" type="text"></td>';
            htmlBody += '</tr><tr>';
            htmlBody += '<td>Email</td><td class="col-md-8"><input class="form-control" id="email" placeholder="Email" name="email" required="" type="email"></td>';
            htmlBody += '</tr></tbody></table>';
            htmlBody += '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJtAxB5csLdrvPbpG3gz5JSb8hTnxJd0YdRbVIJl2x9B-B_UJccPty9cHYJBL2MpSixwc&usqp=CAU" alt="Oracle Netsuite logo">';
            htmlBody += '</body></html>';

            var htmlField = form.addField({
                id: 'custpage_suitelethtml',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'htmlbody'
            });
            htmlField.defaultValue = htmlBody;

            // Botones necesarios        
            form.addButton({
                id: 'btnRegistrar',
                label: 'Registrar',
                functionName: 'obtenerInfo'
            });

            var submitButton = form.addSubmitButton({
                label: 'Enviar'
            });
            submitButton.isHidden = true;
            
            return form;
        }

        function getFileId(name) {
            var result = n_search.create({ 
                type: 'file', 
                filters: ['name', n_search.Operator.IS, name] }).run().getRange({ start: 0, end: 1 });
                
            for (var row in result) return result[row].id;
            return null;
        }

        function crearRegistro(n, a, e){
            
            n_log.debug({title: 'Vamos a crear el registro'});
            var newEstudiante = n_record.create({type: 'customrecord_ai_estudianteshtml', isDynamic: true});

            n_log.debug({title:'Nombre:', details: n});
            newEstudiante.setValue({fieldId: 'name', value: n});
            n_log.debug({title:'Apellido:', details: a});
            newEstudiante.setValue({fieldId: 'custrecord_ai_esthtml_apellido', value: a});
            n_log.debug({title:'Email:', details: e});
            newEstudiante.setValue({fieldId: 'custrecord_ai_esthtml_mail', value: e});

            try { 
                newEstudiante.save();
                n_log.debug({title: 'Nuevo estudiante'});
            } catch (e) {
                n_log.debug({title: e.message});
            }

        }


        return {
            onRequest: onRequest,
            crearRegistro: crearRegistro
        };
    }
); 

