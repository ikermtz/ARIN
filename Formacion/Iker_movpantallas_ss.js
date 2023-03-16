/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | Iker       |  XX/03/23  | Pantalla para movimientos manuales                                  |
     |---------+------------+------------+---------------------------------------------------------------------+

*/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/search', 'N/ui/serverWidget', 'N/record', 'N/format','N/log'],
    function (n_search, serverWidget, n_record, n_format, n_log) {
        
        function onRequest(context) {

            n_log.debug({title: 'Inicio onRequest'});
            
            if (context.request.method == 'GET') {
                
                // Pantalla de inicio
                var form = crearPantallaInicio(context);
                context.response.writePage(form);

            } else if (context.request.method == 'POST' && context.request.parameters.submitter == 'Generar Movimiento') { 
                
                // Pantalla secundaria (GENERAR MOVIMIENTOS)
                var form = crearPantallaSecundaria(context);
                context.response.writePage(form);

            }else if (context.request.method == 'POST' && context.request.parameters.submitter == 'Guardar Movimiento') { 
                
                // Crear movimiento
                generarMovimiento(context);


                // Redirección
                var form = crearPantallaInicio(context);
                context.response.writePage(form);

            }

            n_log.debug({ title: 'Fin onRequest' });
        }

        function crearPantallaInicio(context) {

            var form = serverWidget.createForm({
                title: 'Movimientos, consulta e introducción manual'
            });

            // Client Event para obtener acciones
            form.clientScriptFileId = getFileId('Iker_movpantallas_ce.js');

            // Campos relacionados con el usuario 
            form.addFieldGroup({
                id: 'usergroup',
                label: 'Información del usuario'
            });
            // Campos del usuario 
            var select = form.addField({
                id: 'custpage_usuario',
                type: serverWidget.FieldType.SELECT,
                label: 'Usuario',
                source: 'customrecord_ai_tb_registroej1',
                container: 'usergroup'
            });

            // Campos relacionados con los filtros
            form.addFieldGroup({               
                id: 'filtros',                
                label: 'Movimientos del usuario'            
            });
            // Campos de los filtros
            var fechaIni = form.addField({               
                id: 'custpage_fechainicio',                
                type: serverWidget.FieldType.DATE,                
                label: 'Fecha inicio',         
                container: 'filtros'           
            });            
            var fechaFin = form.addField({               
                id: 'custpage_fechafin',                
                type: serverWidget.FieldType.DATE,                
                label: 'Fecha final',               
                container: 'filtros'           
            });    
            
            // Consulta de parametros
            var parametros = {
                buscar: context.request.parameters.buscar,
                usuario: context.request.parameters.usuario,
                fechainicio : context.request.parameters.fechainicio,
                fechafin : context.request.parameters.fechafin
            };

            if(parametros.buscar == 'Y' && !!parametros.usuario) {

                // Usuario por defecto sera el indicado en la pantalla incial
                select.defaultValue = parametros.usuario;
                var inicio;
                var fin;

                if (!!parametros.fechainicio) {                                      
                    fechaIni.defaultValue = parametros.fechainicio;
                    inicio = parametros.fechainicio;
                }
                if (!!parametros.fechafin) {
                    fechaFin.defaultValue = parametros.fechafin;
                    fin = parametros.fechafin;
                }

                var buscarMov = conseguirMovimientos(parametros.usuario, inicio, fin);

                // Tenemos resultado
                if (buscarMov != undefined) {
                    
                    // Creamos la tabla
                    var tabla = form.addSublist({
                        id: 'custpage_tabla',
                        label: 'Movimientos',
                        type: serverWidget.SublistType.LIST,                
                        container: 'filtros'
                    });

                    // Creamos las columnas de la tabla
                    tabla.addField({
                        id: 'custpage_tabla_concepto',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Concepto'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.INLINE
                    });

                    tabla.addField({
                        id: 'custpage_tabla_importe',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'Importe'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.INLINE
                    });
                    tabla.addField({
                        id: 'custpage_tabla_fecha',
                        type: serverWidget.FieldType.DATE,
                        label: 'Fecha'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.INLINE
                    });
                    tabla.addField({
                        id: 'custpage_tabla_mov',
                        type: serverWidget.FieldType.SELECT,                        
                        source: 'customlist_ai_registroej1_movimientos',
                        label: 'Movimiento  '
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.INLINE
                    });
                    tabla.addField({
                        id: 'custpage_tabla_usuario',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Usuario'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.INLINE
                    });

                    var concepto;
                    var importe;
                    var fecha;
                    var mov;
                    var id;

                    var fila = 0;

                    buscarMov.each(function(movi){
                        
                        // Obtener concepto del movimiento
                        concepto = movi.getValue({
                            name: "custrecord_ai_movimientosej1_concepto",
                        });
                        // Obtener importe del movimiento
                        importe = movi.getValue({
                            name: "custrecord_ai_movimientosej1_importe",
                        }); 
                        // Obtener fecha del movimiento
                        fecha = movi.getValue({
                            name: "custrecord_ai_movimientosej1_fecha",
                        }); 
                        // Obtener tipo de movimiento
                        mov = movi.getValue({
                            name: "custrecord_ai_movimientosej1_mov",
                        });  
                        // Obtener id del usuario correspondiente al movimiento
                        id = movi.getValue({
                            name: "custrecord_ai_movimientosej1_usuario",
                        }); 

                        // Nueva linea a la tabla 
                        tabla.setSublistValue({
                            id: 'custpage_tabla_concepto',
                            line: fila,
                            value: concepto
                        });
                        tabla.setSublistValue({
                            id: 'custpage_tabla_importe',
                            line: fila,
                            value: importe
                        });
                        //compruebo que fecha tiene valor
                        if(!!fecha){
                            tabla.setSublistValue({
                                id: 'custpage_tabla_fecha',
                                line: fila,
                                value: fecha
                            });
                        }                        
                        tabla.setSublistValue({
                            id: 'custpage_tabla_mov',
                            line: fila,
                            value: mov
                        });
                        tabla.setSublistValue({
                            id: 'custpage_tabla_usuario',
                            line: fila,
                            value: id
                        });

                        // Preparamos otra iteración
                        fila++;
                        return true;
                    });
                }               
            } 

            // Botones necesarios        
            form.addSubmitButton({
                label: 'Generar Movimiento'
            });
            form.addButton({
                id: 'btn_consultar',
                label: 'Consultar movimientos',
                functionName: 'consultarMovimientos'
            });
            return form;
        }

        function crearPantallaSecundaria(context) {

            // Creamos la pantalla secundaria
            var form = serverWidget.createForm({
                title: 'Movimientos: introducción manual de movimientos'
            });

            // Script de cliente para capturar botones y acciones
            form.clientScriptFileId = getFileId('Iker_movpantallas_ce.js');

            var submitField = form.addField({
                id: 'custpage_submitfield',
                type: serverWidget.FieldType.TEXT,
                label: 'submitfield'
            });
            submitField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            submitField.defaultValue = 'Guardar Movimiento'; 

            // Campos relacionados con el usuario
            form.addFieldGroup({
                id: 'usergroup',
                label: 'Información del usuario'
            });

            // Campos del usuario
            var select = form.addField({
                id: 'custpage_usuario',
                type: serverWidget.FieldType.SELECT,
                label: 'Usuario',
                source: 'customrecord_ai_tb_registroej1',
                container: 'usergroup'
            });

            // Obtener los parámetros recibidos en la llamada
            var usuario = context.request.parameters.custpage_usuario;
            if (!!usuario){

                // Traemos al usuario seleccionado en la pantalla principal si el campo esta vacio
                select.defaultValue = usuario; 
            }

            // Campos relacionados con el movimiento 
            form.addFieldGroup({
                id: 'usermov',
                label: 'Crear nuevo movimiento para el usuario seleccionado'
            });
            // Campos del movimiento
            form.addField({
                id: 'custpage_importe',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Importe',
                container: 'usermov'
            });
            form.addField({
                id: 'custpage_concepto',
                type: serverWidget.FieldType.TEXT,
                label: 'Concepto',
                container: 'usermov'
            });
            form.addField({
                id: 'custpage_mov',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipo de movimiento',
                source: 'customlist_ai_registroej1_movimientos',
                container: 'usermov'
            });

            // Botones necesarios
            form.addSubmitButton({
                label: 'Guardar Movimiento'
            });
            form.addButton({
                id: 'btn_cancelar',
                label: 'Cancelar',
                functionName: 'cancelar'
            });
            return form;
        }

        function generarMovimiento(context) {

            // Tenemos que crear un movimiento
            var newMov = n_record.create({
                type: 'customrecord_ai_movimientosej1_mov',  
                isDynamic: true
            });

            // Obtener los parámetros
            var usuario = context.request.parameters.custpage_usuario;
            var importe = context.request.parameters.custpage_importe;
            var concepto = context.request.parameters.custpage_concepto;
            var mov = context.request.parameters.custpage_mov;
            var fecha = new Date();

            // Recogemos los valores introducidos
            newMov.setValue({
                fieldId: 'custrecord_ai_movimientosej1_mov',
                value: mov
            });
            newMov.setValue({
                fieldId: 'custrecord_ai_movimientosej1_concepto',
                value: concepto
            });
            newMov.setValue({
                fieldId: 'custrecord_ai_movimientosej1_importe',
                value: importe
            });
            newMov.setValue({
                fieldId: 'custrecord_ai_movimientosej1_fecha',
                value: fecha
            });
            newMov.setValue({
                fieldId: 'custrecord_ai_movimientosej1_usuario',
                value: usuario
            });

            // Guardamos el movimiento creado
            try { 
                newMov.save();
                n_log.debug({title: 'Nuevo movimiento creado'});
            } catch (e) {
                log.error({
                    title: e.name,
                    details: e.message
                });
            }
        }

        function getFileId(name) {
            var result = n_search.create({ 
                type: 'file', 
                filters: ['name', n_search.Operator.IS, name] }).run().getRange({ start: 0, end: 1 });
                
            for (var row in result) return result[row].id;
            return null;
        }

        function conseguirMovimientos(usuario, inicio, fin){   

            // Seleccionamos los filtros
            var filtros = [];

            // Siempre filtramos por usuario
            filtros.push( n_search.createFilter({
                name: 'custrecord_ai_movimientosej1_usuario',
                operator:  n_search.Operator.IS,
                values: usuario
            }));

            // Solo filtraremos si tiene valor
            if(!!inicio) {
                filtros.push(n_search.createFilter({
                    name: 'custrecord_ai_movimientosej1_fecha',
                    operator: n_search.Operator.ONORAFTER,
                    values: inicio 
                }));
            }

            // Solo filtraremos si tiene valor
            if (!!fin) {
                filtros.push(n_search.createFilter({
                    name: 'custrecord_ai_movimientosej1_fecha',
                    operator: n_search.Operator.ONORBEFORE,
                    values: fin 
                }));
            }

            var lista  = n_search.create({          
                type: 'customrecord_ai_movimientosej1_mov',
                filters: filtros,           
                columns: [     
                    // Orden de las colummnas que se muestran en la tabla          
                    n_search.createColumn({name: 'custrecord_ai_movimientosej1_concepto', label: 'Concepto'}),                
                    n_search.createColumn({name: 'custrecord_ai_movimientosej1_importe', label: 'Importe'}),
                    n_search.createColumn({name: 'custrecord_ai_movimientosej1_fecha', label: 'Fecha'}),
                    n_search.createColumn({name: 'custrecord_ai_movimientosej1_mov', label: 'Movimiento'}),
                    n_search.createColumn({name: 'custrecord_ai_movimientosej1_usuario', label: 'Usuario'})
                ],        
            });  

            var movimientos = lista.run();

            return movimientos;       
        }              

        return {
            onRequest: onRequest
        };
    }
);



/*

URL
/app/site/hosting/scriptlet.nl?script=965&deploy=1

*/