/*   +-------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                 |
     |---------+------------+------------+-------------------------------------------------------------+
     |  1.0    | J.Lejarza  |  06/10/21  | ARIN - Procesos de cierre y de apertura.                    |
	 |---------+------------+------------+-------------------------------------------------------------+
     |   Suitelet de gestión de procesos de apertura y cierre.                                         |
     |    - Búsqueda de información contable según tipo de proceso.                                    |
     |    - Creación de asientos de apertura y cierre según información elegida.                       |
     +---------+------------+------------+-------------------------------------------------------------+
     |  1.1    | J.Lejarza  |  22/03/22  | ARIN - Procesos de cierre y de apertura.                    |
	 |---------+------------+------------+-------------------------------------------------------------+
     |  1.2    | I.Martinez |  04/04/23  | ARIN - Procesos de cierre y de apertura - MultiOrg.         |             
     +-------------------------------------------------------------------------------------------------+
     |   Subsidiarias habilitadas.                                                                     |     
     +---------+------------+------------+-------------------------------------------------------------+
*/

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

 define(['N/ui/serverWidget', 'N/search', 'N/format', 'N/http', 'N/record', 'N/error'],
    function (n_serverwidget, n_search, n_format, n_http, n_record, n_error) 
    {
        function onRequest(context) 
        {
            //Entrada a la aplicación. Ventana de búsqueda.
            if (context.request.method == 'GET') 
            {
                var form = crearPantallaBusqueda(context);

                context.response.writePage(form);
            }
            else if(context.request.method == 'POST' && context.request.parameters.submitter == 'Generar Asiento')
            {
                //Crear una nueva factura con los datos introducidos
                var asientoId = createJournal(context);
                //Redirigir a la pantalla de consulta del asiento creado
                context.response.sendRedirect({
                    type: n_http.RedirectType.RECORD,
                    identifier: n_record.Type.JOURNAL_ENTRY,
                    id: asientoId,
                    editMode: false
                });
            }
        }

        function crearPantallaBusqueda(context)
        {
            var form = n_serverwidget.createForm({
                title: 'Proceso de Apertura y Cierre'
            });

            //Script de cliente para capturar botones y acciones
            form.clientScriptFileId = getFileId('pca_procieraper_CE.js');

             //Obtener los parámetros recibidos en la llamada
            var parametros = {
                buscar: context.request.parameters.buscar,
                fechaAsiento: context.request.parameters.fechaAsiento,
                tipoProceso: context.request.parameters.tipoProceso,
                subsidiaria: context.request.parameters.subsidiaria
            };

            form.addFieldGroup({
                id: 'grpfiltros',
                label: 'Búsqueda'
            });

            var subsidiaria = form.addField({
                id: 'subsidiaria',
                type: n_serverwidget.FieldType.SELECT,
                label: 'Subsidiaria',
                source: 'subsidiary',
                container: 'grpfiltros'
            });
            subsidiaria.isMandatory = true;
            if(!!parametros.subsidiaria) subsidiaria.defaultValue = parametros.subsidiaria;
            
            var fechaAsiento = form.addField({
                id: 'fechaasiento',
                type: n_serverwidget.FieldType.DATE,
                label: 'Fecha Asiento',
                source: null,
                container: 'grpfiltros'
            });
            fechaAsiento.isMandatory = true;
            //El parámetro fecha hay que convertirlo para poderlo asignar
            if(!!parametros.fechaAsiento) fechaAsiento.defaultValue = n_format.parse({
                value: parametros.fechaAsiento,
                type: n_format.Type.DATE
            });

            var tipoProceso = form.addField({
                id: 'tipoproceso',
                type: n_serverwidget.FieldType.SELECT,
                label: 'Tipo Proceso',
                source: 'customlist_arin_pca_tiposprocesos',
                container: 'grpfiltros'
            });
            tipoProceso.isMandatory = true;
            if(!!parametros.tipoProceso) tipoProceso.defaultValue = parametros.tipoProceso;

            //Subregión de grid de resultados con resumen de información contable
            var gridCuentas = form.addSublist({
                id: 'gridcuentas',
                label: 'Información Contable',
                type: n_serverwidget.SublistType.LIST
            });

            //Nuevas opciones una vez realizada la búsqueda
            if(parametros.buscar == 'Y')
            {
                //Botón para generar asiento
                form.addSubmitButton({
                    label: 'Generar Asiento'
                });

                //Botón para realizar nueva búsqueda
                gridCuentas.addButton({
                    id: 'nuevabusqueda',
                    label: 'Nueva Búsqueda',
                    functionName: 'habilitarNuevaBusqueda'
                });

                //Deshabilitar los campos de filtros
                fechaAsiento.updateDisplayType({displayType : n_serverwidget.FieldDisplayType.DISABLED});
                tipoProceso.updateDisplayType({displayType : n_serverwidget.FieldDisplayType.DISABLED});
                subsidiaria.updateDisplayType({displayType : n_serverwidget.FieldDisplayType.DISABLED});
            }
            else
            {
                //Botón de buscar si no se ha hecho con anterioridad
                gridCuentas.addButton({
                    id: 'buscar',
                    label: 'Buscar',
                    functionName: 'buscarInformacionContable'
                });
            }

            //Columnas del grid
            gridCuentas.addField({
                id: 'account',
                type: n_serverwidget.FieldType.SELECT,
                label: 'Cuenta',
                source: 'account'
            }).updateDisplayType({
                displayType : n_serverwidget.FieldDisplayType.INLINE
            });

            gridCuentas.addField({
                id: 'debit',
                type: n_serverwidget.FieldType.FLOAT,
                label: 'Debe'
            });

            gridCuentas.addField({
                id: 'credit',
                type: n_serverwidget.FieldType.FLOAT,
                label: 'Haber'
            });

            //Si la pantalla la cargamos tras hacer una búsqueda cargamos datos en el grid
            if(parametros.buscar == 'Y')
            {
                //En función del tipo de proceso se realiza una búsqueda u otra
                var registros;
                if(parametros.tipoProceso == consTiposProceso['AperturaBalance'])
                {
                    var anyoAsiento = new Date(n_format.parse({
                        value: parametros.fechaAsiento,
                        type: n_format.Type.DATE
                    })).getFullYear()-1;
                    
                    registros = busquedaApertura('customsearch_arin_apertura_balance', anyoAsiento, parametros.subsidiaria);
                }
                else if(parametros.tipoProceso == consTiposProceso['CierreBalance'])
                {
                    registros = busquedaCierre('customsearch_arin_cierre_balance', parametros.fechaAsiento, parametros.subsidiaria);
                }
                else if(parametros.tipoProceso == consTiposProceso['CierrePyG'])
                {
                    registros = busquedaCierre('customsearch_arin_cierre_pyg', parametros.fechaAsiento, parametros.subsidiaria);
                }

                var linea = 0;
                registros.each(function(registro){
                    gridCuentas.setSublistValue({
                        id: 'account',
                        line: linea,
                        value: registro.getValue({
                            name: 'account',
                            summary: n_search.Summary.GROUP
                            }) || 0
                    });
                    gridCuentas.setSublistValue({
                        id: 'debit',
                        line: linea,
                        value: registro.getValue({
                            name: 'debitamount',
                            summary: n_search.Summary.SUM
                            }) || 0
                    });
                    gridCuentas.setSublistValue({
                        id: 'credit',
                        line: linea,
                        value: registro.getValue({
                            name: 'creditamount',
                            summary: n_search.Summary.SUM
                            }) || 0
                    });
                    linea++;
                    return true;
                })

            }           

            return form;
        }

        function getFileId(name) 
        {
            var result = n_search.create({type: 'file', filters: ['name', n_search.Operator.IS, name]}).run().getRange({start: 0, end: 1});
            for (var row in result) return result[row].id;
            return null;
        }

        function busquedaCierre(busqueda, fechaAsiento, subsidiaria)
        {
            var busqApuntesContables = n_search.load({
                id: busqueda
            });
            //Añadimos un filtro adicional a los que ya tiene definidos la búsqueda     
            busqApuntesContables.filters.push(n_search.createFilter({
                name: 'trandate',
                operator: n_search.Operator.ONORBEFORE,
                values: fechaAsiento
            }));
            busqApuntesContables.filters.push(n_search.createFilter({
                name: 'subsidiary',
                operator: n_search.Operator.IS,
                values: subsidiaria
            }));

            //Sobrescribimos las columnas que queremos recuperar ya que si no sigue rompiendo por fecha
            var columnas = new Array();
            columnas.push(n_search.createColumn({
                name: "account",
                summary: n_search.Summary.GROUP
            }));
            columnas.push(n_search.createColumn({
                name: "debitamount",
                summary: n_search.Summary.SUM
            }));
            columnas.push(n_search.createColumn({
                name: "creditamount",
                summary: n_search.Summary.SUM
            }));

            busqApuntesContables.columns = columnas;

            return busqApuntesContables.run();
        }

        function busquedaApertura(busqueda, anyoAsiento, subsidiaria)
        {
            var busqApuntesContables = n_search.load({
                id: busqueda
            });
            //Añadimos un filtro adicional a los que ya tiene definidos la búsqueda     
            busqApuntesContables.filters.push(n_search.createFilter({
                name: 'formulatext',
                formula: "TO_CHAR({trandate},'YYYY')",
                operator: n_search.Operator.IS,
                values: anyoAsiento
            }));
            busqApuntesContables.filters.push(n_search.createFilter({
                name: 'subsidiary',
                operator: n_search.Operator.IS,
                values: subsidiaria
            }));

            //Sobrescribimos las columnas que queremos recuperar ya que si no sigue rompiendo por fecha
            var columnas = new Array();
            columnas.push(n_search.createColumn({
                name: "account",
                summary: n_search.Summary.GROUP
            }));
            columnas.push(n_search.createColumn({
                name: "debitamount",
                summary: n_search.Summary.SUM
            }));
            columnas.push(n_search.createColumn({
                name: "creditamount",
                summary: n_search.Summary.SUM
            }));

            busqApuntesContables.columns = columnas;

            return busqApuntesContables.run();
        }

        //Función para crear el asiento según el tipo de proceso y fecha seleccionado
        function createJournal(context)
        {
            //Tipo de proceso seleccionado
            var tipoProceso = context.request.parameters.tipoproceso;
            //Obtener la configuración del tipo de proceso
            //Filtro del tipo de proceso que queremos obtener
            var filtros = new Array();
            filtros.push(n_search.createFilter({
                name: 'custrecord_arin_pca_tipoproceso',
                operator: n_search.Operator.IS,
                values: tipoProceso
            }));

            //Información que necesitamos del registro de configuración
            var columnas = new Array();
            columnas.push(n_search.createColumn({name: "custrecord_arin_pca_catasientocabecera"}));
            columnas.push(n_search.createColumn({name: "custrecord_arin_pca_catajustelinea"}));
            columnas.push(n_search.createColumn({name: "custrecord_arin_pca_notacabecera"}));
            columnas.push(n_search.createColumn({name: "custrecord_arin_pca_notalinea"}));
            columnas.push(n_search.createColumn({name: "custrecord_arin_pca_cuentapyg"}));

            //Crear la búsqueda con los filtros y columnas
            var busqConfiguracionTipoProceso = n_search.create({
                type: 'customrecord_arin_pca_confproccierreaper',
                filters: filtros,
                columns: columnas
            });

            //Ejecutar la búsqueda. Utilizamos getRange para obtener solo un registro y poder acceder directamente
            var registroConfiguracion = busqConfiguracionTipoProceso.run().getRange({start: 0,end: 1});

            if (registroConfiguracion && registroConfiguracion.length > 0) 
            {
                var categoriaCabecera = registroConfiguracion[0].getValue({name: 'custrecord_arin_pca_catasientocabecera'});
                var categoriaLinea = registroConfiguracion[0].getValue({name: 'custrecord_arin_pca_catajustelinea'});
                var notaCabecera = registroConfiguracion[0].getValue({name: 'custrecord_arin_pca_notacabecera'});
                var notaLinea = registroConfiguracion[0].getValue({name: 'custrecord_arin_pca_notalinea'});
                var cuentaPyG = registroConfiguracion[0].getValue({name: 'custrecord_arin_pca_cuentapyg'});

                var totalDebe = 0;
                var totalHaber = 0;
                
                //Crear nuevo asiento
                var nuevoAsiento = n_record.create({
                    type: 'journalentry', 
                    isDynamic: true
                });
                //Datos de cabecera
                nuevoAsiento.setValue('memo', notaCabecera);
                nuevoAsiento.setValue('custbody_arin_categoria_asiento', categoriaCabecera);
                nuevoAsiento.setValue('trandate', new Date(n_format.parse({
                    value: context.request.parameters.fechaasiento,
                    type: n_format.Type.DATE
                })));
                nuevoAsiento.setValue('subsidiary', context.request.parameters.subsidiaria);
                
                //Datos de línea
                for (var linea = 0; linea < context.request.getLineCount('gridcuentas'); linea++) 
                {
                    var debe = 0;
                    var haber = 0;
                    var credit = parseFloat(parseFloat(context.request.getSublistValue('gridcuentas','credit',linea)).toFixed(2));
                    var debit = parseFloat(parseFloat(context.request.getSublistValue('gridcuentas','debit',linea)).toFixed(2));

                    if(credit > debit)
                    {
                        haber = parseFloat((credit - debit).toFixed(2));
                    }
                    else
                    {
                        debe = parseFloat((debit - credit).toFixed(2));
                    }

                    log.audit( { title: 'debe - credit linea revertir', details: debe } );
                    log.audit( { title: 'haber - debit linea revertir', details: haber } );
            
                    totalDebe = parseFloat((totalDebe + debit).toFixed(2));
                    totalHaber = parseFloat((totalHaber + credit).toFixed(2));

                    //log.audit( { title: 'totalDebe', details: totalDebe } );
                    //log.audit( { title: 'totalHaber', details: totalHaber } );

                    nuevoAsiento.selectNewLine('line');
                    nuevoAsiento.setCurrentSublistValue('line', 'account', context.request.getSublistValue('gridcuentas','account',linea));
                    nuevoAsiento.setCurrentSublistValue('line', 'memo', notaLinea);
                    nuevoAsiento.setCurrentSublistValue('line', 'cseg_omg_cat_ajuste', categoriaLinea);
                    //Los saldos los invertimos
                    nuevoAsiento.setCurrentSublistValue('line', 'debit', haber);
                    nuevoAsiento.setCurrentSublistValue('line', 'credit', debe);                   
                    nuevoAsiento.commitLine('line');
                }

                totalDebe = parseFloat(totalDebe.toFixed(2));
                totalHaber = parseFloat(totalHaber.toFixed(2));
                
                log.audit( { title: 'totalDebe', details: totalDebe } );
                log.audit( { title: 'totalHaber', details: totalHaber } );

                //Si el asiento está descuadrado, añadimos la línea adicional
                if(totalDebe != totalHaber)
                {
                    var debe = 0;
                    var haber = 0;
                    if(totalDebe > totalHaber)
                    {
                        debe = totalDebe - totalHaber;
                    }
                    else
                    {
                        haber = totalHaber - totalDebe;
                    }

                    debe = parseFloat(debe.toFixed(2));
                    haber = parseFloat(haber.toFixed(2));

                    log.audit( { title: 'debe - debit linea balance', details: debe } );
                    log.audit( { title: 'haber - credit linea balance', details: haber } );

                    nuevoAsiento.selectNewLine('line');
                    nuevoAsiento.setCurrentSublistValue('line', 'account', cuentaPyG);
                    nuevoAsiento.setCurrentSublistValue('line', 'memo', notaLinea);
                    nuevoAsiento.setCurrentSublistValue('line', 'cseg_omg_cat_ajuste', categoriaLinea);
                    //Los saldos los invertimos
                    nuevoAsiento.setCurrentSublistValue('line', 'debit', debe);
                    nuevoAsiento.setCurrentSublistValue('line', 'credit', haber);
                    
                    nuevoAsiento.commitLine('line');
                }

                return nuevoAsiento.save({enableSourcing: true, ignoreMandatoryFields: true});                
            }
            else
            {
                throw n_error.create({
                    name: 'FALTA_CONFIGURACION',
                    message: 'No se encuentra configuración para el tipo de proceso seleccionado.',
                    notifyOff: true
                }).message;
            }
        }

        var consTiposProceso = {};
        consTiposProceso['AperturaBalance'] = '1';
        consTiposProceso['CierreBalance'] = '2';
        consTiposProceso['CierrePyG'] = '3';

        return {
            onRequest: onRequest
        };
    }
 );